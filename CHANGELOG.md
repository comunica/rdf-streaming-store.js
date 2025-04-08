# Changelog
All notable changes to this project will be documented in this file.

<a name="v2.1.1"></a>
## [v2.1.1](https://github.com/comunica/rdf-streaming-store.js/compare/v2.1.0...v2.1.1) - 2025-04-08

### Fixed
* [Fix quad event not being emitted anymore](https://github.com/comunica/rdf-streaming-store.js/commit/95f477ea0e7acce59aa9acdecc6121d65d447060)

<a name="v2.1.0"></a>
## [v2.1.0](https://github.com/comunica/rdf-streaming-store.js/compare/v2.0.0...v2.1.0) - 2025-02-27

### Added
* [Add methods to check if store has ended](https://github.com/comunica/rdf-streaming-store.js/commit/8ad2927c15dcb03ac8683c215c239236589972d7)

<a name="v2.0.0"></a>
## [v2.0.0](https://github.com/comunica/rdf-streaming-store.js/compare/v1.1.5...v2.0.0) - 2025-01-08

### BREAKING CHANGES
* [Update to rdf-data-factory v2](https://github.com/comunica/rdf-streaming-store.js/commit/332f393e3cce430d269cbb0183a2b89b8b9fdc76)
    This includes a bump to @rdfjs/types@2.0.0, which requires TypeScript 5 and Node 14+

<a name="v1.1.5"></a>
## [v1.1.5](https://github.com/comunica/rdf-streaming-store.js/compare/v1.1.4...v1.1.5) - 2024-08-23

### Fixed
* [Fix race condition when pending stream ends before store stream](https://github.com/comunica/rdf-streaming-store.js/commit/de73725d0d294f247ae02bcd078e01cb2d458648)

<a name="v1.1.4"></a>
## [v1.1.4](https://github.com/comunica/rdf-streaming-store.js/compare/v1.1.3...v1.1.4) - 2024-02-20

### Fixed
* [Fix duplicate quads during parallel import and match](https://github.com/comunica/rdf-streaming-store.js/commit/5c46be0ac4186c08234405cd2e08ba3dc57d9a2a)

<a name="v1.1.3"></a>
## [v1.1.3](https://github.com/comunica/rdf-streaming-store.js/compare/v1.1.2...v1.1.3) - 2024-02-06

### Fixed
* [Fix duplicate triples being emitted multiple times](https://github.com/comunica/rdf-streaming-store.js/commit/4d0d540389d021136095a671de90163cc9f0e0d5)

<a name="v1.1.2"></a>
## [v1.1.2](https://github.com/comunica/rdf-streaming-store.js/compare/v1.1.1...v1.1.2) - 2024-01-17

### Fixed
* [Revert "Fix duplicate triples being emitted multiple times"](https://github.com/comunica/rdf-streaming-store.js/commit/e64d113ab9d6833f4cf70b6a79305a6fb742d9b2)

<a name="v1.1.1"></a>
## [v1.1.1](https://github.com/comunica/rdf-streaming-store.js/compare/v1.1.0...v1.1.1) - 2024-01-11

### Fixed
* [Fix duplicate triples being emitted multiple times](https://github.com/comunica/rdf-streaming-store.js/commit/d11c8cea3fd930330f1f90796eb6491ba0c0c3dd)

<a name="v1.1.0"></a>
## [v1.1.0](https://github.com/comunica/rdf-streaming-store.js/compare/v1.0.2...v1.1.0) - 2023-04-12

### Added
* [Emit 'quad' event in derived streams](https://github.com/comunica/rdf-streaming-store.js/commit/e66f68c9f47eb832179ffe636bf3c026f8cf690f)

<a name="v1.0.2"></a>
## [v1.0.2](https://github.com/comunica/rdf-streaming-store.js/compare/v1.0.1...v1.0.2) - 2023-03-08

### Fixed
* [Unpipe streams on store end](https://github.com/comunica/rdf-streaming-store.js/commit/05677532e6b7066bbc0289d0f16e40418fc60dbf)

<a name="v1.0.1"></a>
## [v1.0.1](https://github.com/comunica/rdf-streaming-store.js/compare/v1.0.0...v1.0.1) - 2023-03-06

### Fixed
* [Fix error when store is ended during an import stream](https://github.com/comunica/rdf-streaming-store.js/commit/7cbb3f278a6b5b3f9030cda17d50071921b7da32)

<a name="v1.0.0"></a>
## [v1.0.0] - 2023-01-25

Initial release
