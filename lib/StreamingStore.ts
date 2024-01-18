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

  /**
   * This function will read the quad stream in an on-demand fashion, and will check if the quads already exist in the
   * store. If they don't, they will be pushed into the storeImportStream, and the matching pendingStreams.
   * @param stream A quad stream.
   * @param storeImportStream A stream to import the quads into the store.
   */
  protected importToListeners(stream: RDF.Stream<Q>, storeImportStream: PassThrough): void {
    let streamEnded = false;
    let streamReadable = false;
    stream.on('readable', async() => {
      streamReadable = true;
      let quad: Q | null = stream.read();
      while (quad) {
        const staticQuad = quad;
        await new Promise<void>(resolve => {
          // Match the new quad with the store.
          const matchStream = this.store.match(
            staticQuad.subject,
            staticQuad.predicate,
            staticQuad.object,
            staticQuad.graph,
          );

          // If the StreamingStore hasn't ended, we add the quad to the storeImportStream and the corresponding
          // pendingStreams and resolve to handle the next quad.
          const handleEnd = (): void => {
            if (!this.ended) {
              storeImportStream.push(staticQuad);
              for (const pendingStream of this.pendingStreams.getPendingStreamsForQuad(staticQuad)) {
                pendingStream.push(staticQuad);
                pendingStream.emit('quad', staticQuad);
              }
            }
            resolve();
          };

          // If the matchStream has a result, the quad already exists.
          // We remove the 'end' listener and continue to the next quad.
          matchStream.once('data', () => {
            matchStream.removeListener('end', handleEnd);
            resolve();
          });

          // If the matchStream has ended (and this listener isn't removed), the quad doesn't exist yet.
          // So we call the handleEnd function.
          matchStream.once('end', handleEnd);
        });

        quad = stream.read();
      }
      // If the stream has ended, all quads will be read from the quad stream, so we can end the storeImportStream.
      if (streamEnded) {
        storeImportStream.end();
      }
      streamReadable = false;
    });

    stream.on('end', () => {
      // If the stream is still readable let the on readable function end the `storeImportStream`, else do it now.
      if (streamReadable) {
        streamEnded = true;
      } else {
        storeImportStream.end();
      }
    });
  }

  public import(stream: RDF.Stream<Q>): EventEmitter {
    if (this.ended) {
      throw new Error('Attempted to import into an ended StreamingStore');
    }

    const storeImportStream = new PassThrough({ objectMode: true });
    stream.on('error', error => storeImportStream.emit('error', error));

    this.importToListeners(stream, storeImportStream);

    return this.store.import(storeImportStream);
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

