import type { EventEmitter } from 'events';
import type * as RDF from '@rdfjs/types';
import { Store } from 'n3';
import type { Readable } from 'readable-stream';
import { PassThrough } from 'readable-stream';
import { PendingStreamsIndex } from './PendingStreamsIndex';

/**
 * A StreamingStore allows data lookup and insertion to happen in parallel.
 * Concretely, this means that `match()` calls happening before `import()` calls, will still consider those triples that
 * are inserted later, which is done by keeping the response streams of `match()` open.
 * Only when the `end()` method is invoked, all response streams will close, and the StreamingStore will be considered
 * immutable.
 *
 * WARNING: `end()` MUST be called at some point, otherwise all `match` streams will remain unended.
 */
export class StreamingStore<Q extends RDF.BaseQuad = RDF.Quad, S extends RDF.Store<Q> = Store<Q>>
implements RDF.Source<Q>, RDF.Sink<RDF.Stream<Q>, EventEmitter> {
  protected readonly store: S;
  protected readonly pendingStreams: PendingStreamsIndex<Q> = new PendingStreamsIndex();
  protected ended = false;

  public constructor(store: RDF.Store<Q> = new Store<Q>()) {
    this.store = <S> store;
  }

  /**
   * Mark this store as ended.
   *
   * This will make sure that all running and future `match` calls will end,
   * and all next `import` calls to this store will throw an error.
   */
  public end(): void {
    this.ended = true;

    // Mark all pendingStreams as ended.
    for (const pendingStream of this.pendingStreams.allStreams) {
      pendingStream.push(null);
      (<any> pendingStream)._pipeSource.unpipe();
    }
  }

  protected importToListeners(stream: RDF.Stream<Q>): void {
    stream.on('data', (quad: Q) => {
      for (const pendingStream of this.pendingStreams.getPendingStreamsForQuad(quad)) {
        if (!this.ended) {
          pendingStream.push(quad);
          pendingStream.emit('quad', quad);
        }
      }
    });
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
      stream = storeResult.pipe(pendingStream, { end: false });
      (<any> stream)._pipeSource = storeResult;
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

