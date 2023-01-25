# RDF Data Factory

[![Build status](https://github.com/comunica/rdf-streaming-store.js/workflows/CI/badge.svg)](https://github.com/comunica/rdf-streaming-store.js/actions?query=workflow%3ACI)
[![Coverage Status](https://coveralls.io/repos/github/comunica/rdf-streaming-store.js/badge.svg?branch=master)](https://coveralls.io/github/comunica/rdf-streaming-store.js?branch=master)
[![npm version](https://badge.fury.io/js/rdf-streaming-store.svg)](https://www.npmjs.com/package/rdf-streaming-store)

A read-only [RDF/JS store](https://rdf.js.org/stream-spec/#store-interface) that allows parallel data lookup and insertion.
It works in both JavaScript and TypeScript.

Concretely, this means that `match()` calls happening before `import()` calls, will still consider those triples that
are inserted later, which is done by keeping the response streams of `match()` open.
Only when the `end()` method is invoked, all response streams will close, and the StreamingStore will be considered
immutable.

WARNING: `end()` MUST be called at some point, otherwise all `match` streams will remain unended.

If using TypeScript, it is recommended to use this in conjunction with [`@types/rdf-js`](https://www.npmjs.com/package/@types/rdf-js).

## Installation

```bash
$ npm install rdf-streaming-store
```
or
```bash
$ yarn add rdf-streaming-store
```

This package also works out-of-the-box in browsers via tools such as [webpack](https://webpack.js.org/) and [browserify](http://browserify.org/).

## Usage

TODO

## License
This software is written by Maarten Vandenbrande and [Ruben Taelman](https://rubensworks.net/).

This code is released under the [MIT license](http://opensource.org/licenses/MIT).
