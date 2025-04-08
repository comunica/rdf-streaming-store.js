import 'jest-rdf';
import type * as RDF from '@rdfjs/types';
import arrayifyStream from 'arrayify-stream';
import { promisifyEventEmitter } from 'event-emitter-promisify/dist';
import { Store } from 'n3';
import { DataFactory } from 'rdf-data-factory';
import { Readable, PassThrough } from 'readable-stream';
import { StreamingStore } from '../lib/StreamingStore';
const quad = require('rdf-quad');
const streamifyArray = require('streamify-array');

const DF = new DataFactory();

describe('StreamingStore', () => {
  let store: StreamingStore;

  beforeEach(() => {
    store = new StreamingStore();
  });

  it('exposes the internal store', async() => {
    expect(store.getStore()).toBeInstanceOf(Store);
  });

  it('handles an empty ended store', async() => {
    store.end();
    expect(await arrayifyStream(store.match()))
      .toEqual([]);
  });

  it('handles an empty non-ended store', async() => {
    const stream = store.match();
    jest.spyOn(stream, 'on');
    await new Promise(setImmediate);
    expect(stream.on).not.toHaveBeenCalled();
  });

  it('throws when importing to an ended store', async() => {
    store.end();
    expect(() => store.import(<any>undefined))
      .toThrow('Attempted to import into an ended StreamingStore');
  });

  it('gracefully handles ending during slow imports', async() => {
    const readStream = store.match();

    const importStream = new Readable({ objectMode: true });
    importStream._read = () => {
      setImmediate(() => {
        importStream.push(quad('s1', 'p1', 'o1'));
        importStream.push(null);
      });
    };
    store.import(importStream);
    store.end();
    await new Promise(resolve => importStream.on('end', resolve));

    readStream.on('data', () => {
      // Void reads
    });
    const errorHandler = jest.fn();
    readStream.on('error', errorHandler);
    await new Promise(resolve => readStream.on('end', resolve));

    expect(errorHandler).not.toHaveBeenCalled();
  });

  it('gracefully handles ending during very slow imports', async() => {
    const readStream = store.match();

    const importStream = new Readable({ objectMode: true });
    importStream._read = () => {
      // Do nothing
    };
    store.import(importStream);
    store.end();

    readStream.on('data', () => {
      // Void reads
    });
    const errorHandler = jest.fn();
    readStream.on('error', errorHandler);
    await new Promise(resolve => readStream.on('end', resolve));

    importStream.push(quad('s1', 'p1', 'o1'));
    importStream.push(null);

    expect(errorHandler).not.toHaveBeenCalled();
  });

  it('handles one match after end', async() => {
    await promisifyEventEmitter(store.import(streamifyArray([
      quad('s1', 'p1', 'o1'),
      quad('s2', 'p2', 'o2'),
    ])));
    store.end();

    expect(await arrayifyStream(store.match()))
      .toBeRdfIsomorphic([
        quad('s1', 'p1', 'o1'),
        quad('s2', 'p2', 'o2'),
      ]);
  });

  it('handles one match with multiple imports after end', async() => {
    await promisifyEventEmitter(store.import(streamifyArray([
      quad('s1', 'p1', 'o1'),
    ])));
    await promisifyEventEmitter(store.import(streamifyArray([
      quad('s2', 'p2', 'o2'),
    ])));
    await promisifyEventEmitter(store.import(streamifyArray([
      quad('s3', 'p3', 'o3'),
      quad('s4', 'p4', 'o4'),
    ])));
    store.end();

    expect(await arrayifyStream(store.match()))
      .toBeRdfIsomorphic([
        quad('s1', 'p1', 'o1'),
        quad('s2', 'p2', 'o2'),
        quad('s3', 'p3', 'o3'),
        quad('s4', 'p4', 'o4'),
      ]);
  });

  it('handles one match before end', async() => {
    await promisifyEventEmitter(store.import(streamifyArray([
      quad('s1', 'p1', 'o1'),
      quad('s2', 'p2', 'o2'),
    ])));
    const match1 = store.match();
    setImmediate(() => store.end());

    expect(await arrayifyStream(match1))
      .toBeRdfIsomorphic([
        quad('s1', 'p1', 'o1'),
        quad('s2', 'p2', 'o2'),
      ]);
  });

  it('handles one match with multiple imports before end', async() => {
    await promisifyEventEmitter(store.import(streamifyArray([
      quad('s1', 'p1', 'o1'),
    ])));
    await promisifyEventEmitter(store.import(streamifyArray([
      quad('s2', 'p2', 'o2'),
    ])));
    await promisifyEventEmitter(store.import(streamifyArray([
      quad('s3', 'p3', 'o3'),
      quad('s4', 'p4', 'o4'),
    ])));
    const match1 = store.match();
    setImmediate(() => store.end());

    expect(await arrayifyStream(match1))
      .toBeRdfIsomorphic([
        quad('s1', 'p1', 'o1'),
        quad('s2', 'p2', 'o2'),
        quad('s3', 'p3', 'o3'),
        quad('s4', 'p4', 'o4'),
      ]);
  });

  it('handles multiple matches after end', async() => {
    await promisifyEventEmitter(store.import(streamifyArray([
      quad('s1', 'p1', 'o1'),
      quad('s2', 'p2', 'o2'),
    ])));
    store.end();
    const match1 = store.match();
    const match2 = store.match();
    const match3 = store.match();

    expect(await arrayifyStream(match1))
      .toBeRdfIsomorphic([
        quad('s1', 'p1', 'o1'),
        quad('s2', 'p2', 'o2'),
      ]);
    expect(await arrayifyStream(match2))
      .toBeRdfIsomorphic([
        quad('s1', 'p1', 'o1'),
        quad('s2', 'p2', 'o2'),
      ]);
    expect(await arrayifyStream(match3))
      .toBeRdfIsomorphic([
        quad('s1', 'p1', 'o1'),
        quad('s2', 'p2', 'o2'),
      ]);
  });

  it('handles multiple matches with multiple imports after end', async() => {
    await promisifyEventEmitter(store.import(streamifyArray([
      quad('s1', 'p1', 'o1'),
    ])));
    await promisifyEventEmitter(store.import(streamifyArray([
      quad('s2', 'p2', 'o2'),
    ])));
    await promisifyEventEmitter(store.import(streamifyArray([
      quad('s3', 'p3', 'o3'),
      quad('s4', 'p4', 'o4'),
    ])));
    store.end();
    const match1 = store.match();
    const match2 = store.match();
    const match3 = store.match();

    expect(await arrayifyStream(match1))
      .toBeRdfIsomorphic([
        quad('s1', 'p1', 'o1'),
        quad('s2', 'p2', 'o2'),
        quad('s3', 'p3', 'o3'),
        quad('s4', 'p4', 'o4'),
      ]);
    expect(await arrayifyStream(match2))
      .toBeRdfIsomorphic([
        quad('s1', 'p1', 'o1'),
        quad('s2', 'p2', 'o2'),
        quad('s3', 'p3', 'o3'),
        quad('s4', 'p4', 'o4'),
      ]);
    expect(await arrayifyStream(match3))
      .toBeRdfIsomorphic([
        quad('s1', 'p1', 'o1'),
        quad('s2', 'p2', 'o2'),
        quad('s3', 'p3', 'o3'),
        quad('s4', 'p4', 'o4'),
      ]);
  });

  it('handles multiple matches before end', async() => {
    await promisifyEventEmitter(store.import(streamifyArray([
      quad('s1', 'p1', 'o1'),
      quad('s2', 'p2', 'o2'),
    ])));
    const match1 = store.match();
    const match2 = store.match();
    const match3 = store.match();
    setImmediate(() => store.end());

    expect(await arrayifyStream(match1))
      .toBeRdfIsomorphic([
        quad('s1', 'p1', 'o1'),
        quad('s2', 'p2', 'o2'),
      ]);
    expect(await arrayifyStream(match2))
      .toBeRdfIsomorphic([
        quad('s1', 'p1', 'o1'),
        quad('s2', 'p2', 'o2'),
      ]);
    expect(await arrayifyStream(match3))
      .toBeRdfIsomorphic([
        quad('s1', 'p1', 'o1'),
        quad('s2', 'p2', 'o2'),
      ]);
  });

  it('handles multiple matches with multiple imports before end', async() => {
    await promisifyEventEmitter(store.import(streamifyArray([
      quad('s1', 'p1', 'o1'),
    ])));
    await promisifyEventEmitter(store.import(streamifyArray([
      quad('s2', 'p2', 'o2'),
    ])));
    await promisifyEventEmitter(store.import(streamifyArray([
      quad('s3', 'p3', 'o3'),
      quad('s4', 'p4', 'o4'),
    ])));
    const match1 = store.match();
    const match2 = store.match();
    const match3 = store.match();
    setImmediate(() => store.end());

    expect(await arrayifyStream(match1))
      .toBeRdfIsomorphic([
        quad('s1', 'p1', 'o1'),
        quad('s2', 'p2', 'o2'),
        quad('s3', 'p3', 'o3'),
        quad('s4', 'p4', 'o4'),
      ]);
    expect(await arrayifyStream(match2))
      .toBeRdfIsomorphic([
        quad('s1', 'p1', 'o1'),
        quad('s2', 'p2', 'o2'),
        quad('s3', 'p3', 'o3'),
        quad('s4', 'p4', 'o4'),
      ]);
    expect(await arrayifyStream(match3))
      .toBeRdfIsomorphic([
        quad('s1', 'p1', 'o1'),
        quad('s2', 'p2', 'o2'),
        quad('s3', 'p3', 'o3'),
        quad('s4', 'p4', 'o4'),
      ]);
  });

  it('handles one match with imports before and after end', async() => {
    await promisifyEventEmitter(store.import(streamifyArray([
      quad('s1', 'p1', 'o1'),
    ])));
    const match1 = store.match();
    setImmediate(async() => {
      await promisifyEventEmitter(store.import(streamifyArray([
        quad('s2', 'p2', 'o2'),
      ])));
      setImmediate(async() => {
        await promisifyEventEmitter(store.import(streamifyArray([
          quad('s3', 'p3', 'o3'),
          quad('s4', 'p4', 'o4'),
        ])));
        setImmediate(() => store.end());
      });
    });

    expect(await arrayifyStream(match1))
      .toBeRdfIsomorphic([
        quad('s1', 'p1', 'o1'),
        quad('s2', 'p2', 'o2'),
        quad('s3', 'p3', 'o3'),
        quad('s4', 'p4', 'o4'),
      ]);
  });

  it('handles multiple matches with imports before and after end', async() => {
    await promisifyEventEmitter(store.import(streamifyArray([
      quad('s1', 'p1', 'o1'),
    ])));
    const match1 = store.match();
    const match2 = store.match();
    setImmediate(async() => {
      await promisifyEventEmitter(store.import(streamifyArray([
        quad('s2', 'p2', 'o2'),
      ])));
      setImmediate(async() => {
        await promisifyEventEmitter(store.import(streamifyArray([
          quad('s3', 'p3', 'o3'),
          quad('s4', 'p4', 'o4'),
        ])));
        setImmediate(() => store.end());
      });
    });

    expect(await arrayifyStream(match1))
      .toBeRdfIsomorphic([
        quad('s1', 'p1', 'o1'),
        quad('s2', 'p2', 'o2'),
        quad('s3', 'p3', 'o3'),
        quad('s4', 'p4', 'o4'),
      ]);
    expect(await arrayifyStream(match2))
      .toBeRdfIsomorphic([
        quad('s1', 'p1', 'o1'),
        quad('s2', 'p2', 'o2'),
        quad('s3', 'p3', 'o3'),
        quad('s4', 'p4', 'o4'),
      ]);
  });

  it('handles multiple async matches with imports before and after end', async() => {
    await promisifyEventEmitter(store.import(streamifyArray([
      quad('s1', 'p1', 'o1'),
    ])));
    const match1 = store.match();
    setImmediate(async() => {
      await promisifyEventEmitter(store.import(streamifyArray([
        quad('s2', 'p2', 'o2'),
      ])));
      setImmediate(async() => {
        await promisifyEventEmitter(store.import(streamifyArray([
          quad('s3', 'p3', 'o3'),
          quad('s4', 'p4', 'o4'),
        ])));
        setImmediate(() => store.end());
      });

      setImmediate(async() => {
        expect(await arrayifyStream(store.match()))
          .toBeRdfIsomorphic([
            quad('s1', 'p1', 'o1'),
            quad('s2', 'p2', 'o2'),
            quad('s3', 'p3', 'o3'),
            quad('s4', 'p4', 'o4'),
          ]);
      });
    });

    expect(await arrayifyStream(match1))
      .toBeRdfIsomorphic([
        quad('s1', 'p1', 'o1'),
        quad('s2', 'p2', 'o2'),
        quad('s3', 'p3', 'o3'),
        quad('s4', 'p4', 'o4'),
      ]);
  });

  it('handles matches for different quad patterns', async() => {
    const m1 = store.match();
    const ms1 = store.match(DF.namedNode('s'));
    const ms2 = store.match(DF.namedNode('s'), DF.namedNode('p'));
    const ms3 = store.match(DF.namedNode('s'), DF.namedNode('p'), DF.namedNode('o'));
    const ms4 = store
      .match(DF.namedNode('s'), DF.namedNode('p'), DF.namedNode('o'), DF.namedNode('g'));
    const mp1 = store.match(undefined, DF.namedNode('p'));
    const mp2 = store.match(undefined, DF.namedNode('p'), DF.namedNode('o'));
    const mp3 = store.match(undefined, DF.namedNode('p'), DF.namedNode('o'), DF.namedNode('g'));
    const mo1 = store.match(undefined, undefined, DF.namedNode('o'));
    const mo2 = store.match(undefined, undefined, DF.namedNode('o'), DF.namedNode('g'));
    const mg1 = store.match(undefined, undefined, undefined, DF.namedNode('g'));

    setImmediate(async() => {
      await promisifyEventEmitter(store.import(streamifyArray([
        quad('s', 'p1', 'o1'),
        quad('s', 'p', 'o2'),
        quad('s3', 'p', 'o'),
        quad('s4', 'p4', 'o', 'g'),
      ])));
      store.end();
    });

    expect(await arrayifyStream(m1))
      .toBeRdfIsomorphic([
        quad('s', 'p1', 'o1'),
        quad('s', 'p', 'o2'),
        quad('s3', 'p', 'o'),
        quad('s4', 'p4', 'o', 'g'),
      ]);

    expect(await arrayifyStream(ms1))
      .toBeRdfIsomorphic([
        quad('s', 'p1', 'o1'),
        quad('s', 'p', 'o2'),
      ]);
    expect(await arrayifyStream(ms2))
      .toBeRdfIsomorphic([
        quad('s', 'p', 'o2'),
      ]);
    expect(await arrayifyStream(ms3))
      .toBeRdfIsomorphic([]);
    expect(await arrayifyStream(ms4))
      .toBeRdfIsomorphic([]);

    expect(await arrayifyStream(mp1))
      .toBeRdfIsomorphic([
        quad('s', 'p', 'o2'),
        quad('s3', 'p', 'o'),
      ]);
    expect(await arrayifyStream(mp2))
      .toBeRdfIsomorphic([
        quad('s3', 'p', 'o'),
      ]);
    expect(await arrayifyStream(mp3))
      .toBeRdfIsomorphic([]);

    expect(await arrayifyStream(mo1))
      .toBeRdfIsomorphic([
        quad('s3', 'p', 'o'),
        quad('s4', 'p4', 'o', 'g'),
      ]);
    expect(await arrayifyStream(mo2))
      .toBeRdfIsomorphic([
        quad('s4', 'p4', 'o', 'g'),
      ]);

    expect(await arrayifyStream(mg1))
      .toBeRdfIsomorphic([
        quad('s4', 'p4', 'o', 'g'),
      ]);
  });

  it('handles duplicates in import (set-semantics)', async() => {
    const match = store.match();
    await promisifyEventEmitter(store.import(streamifyArray([
      quad('s1', 'p1', 'o1'),
      quad('s1', 'p1', 'o1'),
    ])));
    store.end();

    expect(await arrayifyStream(match)).toEqualRdfQuadArray(
      [ quad('s1', 'p1', 'o1') ],
    );
  });

  it('handles duplicates in import (set-semantics) during slow import', async() => {
    const match = store.match();

    const importStream = new Readable({ objectMode: true });
    importStream._read = () => {
      setImmediate(() => {
        importStream.push(quad('s1', 'p1', 'o1'));
      });
      setImmediate(() => {
        importStream.push(quad('s1', 'p1', 'o1'));
      });
      setImmediate(() => {
        importStream.push(null);
      });
    };
    store.import(importStream);
    await new Promise(resolve => importStream.on('end', resolve));
    store.end();

    expect(await arrayifyStream(match)).toEqualRdfQuadArray(
      [ quad('s1', 'p1', 'o1') ],
    );
  });

  it('handles parallel import and match', async() => {
    const importStream = new Readable({ objectMode: true });
    importStream._read = () => {
      importStream.push(quad('s1', 'p1', 'o1'));
      importStream.push(null);
    };
    store.import(importStream);

    const match = store.match();
    const listener = jest.fn();
    match.on('data', listener);

    const p = new Promise(resolve => match.on('end', resolve));
    store.end();
    await p;

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('handles errors in import', async() => {
    const importStream = new PassThrough({ objectMode: true });
    const returnStream = store.import(importStream);
    const error = new Error('myError');
    const callback = jest.fn();

    returnStream.on('error', callback);
    importStream.emit('error', error);

    expect(callback).toHaveBeenCalled();
    expect(callback).toHaveBeenCalledWith(error);
    store.end();
  });

  it('handles pending stream ending before store stream', async() => {
    const importStream = new Readable({ objectMode: true });
    importStream._read = () => {
      importStream.push(quad('s1', 'p1', 'o1'));
      importStream.push(null);
    };
    store.import(importStream);
    await new Promise(resolve => importStream.on('end', resolve));

    const match = store.match();
    const listener = jest.fn();
    match.on('data', listener);

    store.end();
    await new Promise(resolve => match.on('end', resolve));

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('should emit a quad event when new matching quads are imported to the store', async() => {
    await promisifyEventEmitter(store.import(streamifyArray([
      quad('s1', 'p1', 'o1'),
      quad('s2', 'p2', 'o2'),
    ])));

    const stream = store.match(DF.namedNode('s1'));
    const quads: RDF.Quad[] = [];
    stream.on('quad', importedQuad => {
      quads.push(importedQuad);
    });

    await promisifyEventEmitter(store.import(streamifyArray([
      quad('s1', 'p3', 'o3'),
      quad('s4', 'p4', 'o4'),
    ])));

    store.end();
    expect(quads).toStrictEqual(
      [
        quad('s1', 'p3', 'o3'),
      ],
    );
  });
});
