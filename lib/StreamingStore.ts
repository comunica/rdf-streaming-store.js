import type { EventEmitter } from 'events';
import type * as RDF from '@rdfjs/types';
import { Store } from 'n3';
import { Readable, PassThrough } from 'readable-stream';
import { PendingStreamsIndex } from './PendingStreamsIndex';

type ListenerCallback = () => void;

interface ILocalStore<Q extends RDF.BaseQuad> extends RDF.Store<Q> {
  countQuads: (
    subject: RDF.Term | null,
    predicate: RDF.Term | null,
    object: RDF.Term | null,
    graph: RDF.Term | null,
  ) => number;
}

/**
 * A StreamingStore allows data lookup and insertion to happen in parallel.
 * Concretely, this means that `match()` calls happening before `import()` calls, will still consider those triples that
 * are inserted later, which is done by keeping the response streams of `match()` open.
 * Only when the `end()` method is invoked, all response streams will close, and the StreamingStore will be considered
 * immutable.
 *
 * WARNING: `end()` MUST be called at some point, otherwise all `match` streams will remain unended.
 */
export class StreamingStore<Q extends RDF.BaseQuad = RDF.Quad, S extends ILocalStore<Q> = Store<Q>>
implements RDF.Source<Q>, RDF.Sink<RDF.Stream<Q>, EventEmitter> {
  protected readonly store: S;
  protected readonly pendingStreams: PendingStreamsIndex<Q> = new PendingStreamsIndex();
  protected ended = false;
  protected listeners: ListenerCallback[] = [];

  public constructor(store: RDF.Store<Q> = new Store<Q>()) {
    this.store = <S>store;
  }

  public addEndListener(listener: ListenerCallback): void {
    this.listeners.push(listener);
  }

  private emitEndEvent(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }

  public hasEnded(): boolean {
    return this.ended;
  }

  /**
   * Mark this store as ended.
   *
   * This will make sure that all running and future `match` calls will end,
   * and all next `import` calls to this store will throw an error.
   * It will run all the listeners added with `addEndListener.`
   */
  public end(): void {
    this.ended = true;

    // Mark all pendingStreams as ended.
    for (const pendingStream of this.pendingStreams.allStreams) {
      pendingStream.push(null);
    }
    this.emitEndEvent();
  }

  protected importToListeners(stream: RDF.Stream<Q>): void {
    stream.on('data', (quad: Q) => {
      if (!this.ended && !this.store.countQuads(
        quad.subject,
        quad.predicate,
        quad.object,
        quad.graph,
      )) {
        for (const pendingStream of this.pendingStreams.getPendingStreamsForQuad(quad)) {
          if ((<any>pendingStream).isInitialized) {
            pendingStream.push(quad);
            pendingStream.emit('quad', quad);
          }
        }
      }
    });
  }

  protected static async * concatStreams(readables: Readable[]): AsyncIterableIterator<any> {
    for (const readable of readables) {
      for await (const chunk of readable) {
        yield chunk;
      }
    }
  }

  public import(stream: RDF.Stream<Q>): EventEmitter {
    if (this.ended) {
      throw new Error('Attempted to import into an ended StreamingStore');
    }

    this.importToListeners(stream);
    return this.store.import(stream);
  }

  public match(
    subject?: RDF.Term | null,
    predicate?: RDF.Term | null,
    object?: RDF.Term | null,
    graph?: RDF.Term | null,
  ): RDF.Stream<Q> {
    const storeResult: Readable = <Readable> this.store.match(subject, predicate, object, graph);
    let stream: RDF.Stream<Q> = storeResult;

    // If the store hasn't ended yet, also create a new pendingStream
    if (!this.ended) {
      // The new pendingStream remains open, until the store is ended.
      const pendingStream = new PassThrough({ objectMode: true });
      this.pendingStreams.addPatternListener(pendingStream, subject, predicate, object, graph);
      stream = Readable.from(StreamingStore.concatStreams([ storeResult, pendingStream ]));
      (<any>stream)._pipeSource = storeResult;

      // This is an ugly hack to annotate pendingStream with the isInitialized once the store stream started being read.
      // This is necessary to avoid duplicate quads cases where match() is called but not yet read, an import is done,
      // and only then the match() stream is read.
      // eslint-disable-next-line @typescript-eslint/unbound-method
      const readOld = storeResult._read;
      storeResult._read = (size: number) => {
        (<any>pendingStream).isInitialized = true;
        readOld.call(storeResult, size);
      };
    }
    return stream;
  }

  /**
   * The internal store with all imported quads.
   */
  public getStore(): S {
    return this.store;
  }
}

