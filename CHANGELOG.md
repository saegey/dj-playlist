# Changelog

## [0.1.5](https://github.com/Public-Vinyl-Radio/groovenet/compare/v0.1.4...v0.1.5) (2026-09-11)


### Features

* reorder playlist PDF export columns to #, ID, Pos ([#157](https://github.com/Public-Vinyl-Radio/groovenet/issues/157)) ([fde40a7](https://github.com/Public-Vinyl-Radio/groovenet/commit/fde40a7fd368ad47a485bd643b9b2fe41a44506b))
* unify track actions menu across card, view, and edit ([#162](https://github.com/Public-Vinyl-Radio/groovenet/issues/162)) ([1b3f888](https://github.com/Public-Vinyl-Radio/groovenet/commit/1b3f88844c1a946ac73ef04bc404df9fb9e85263))


### Bug Fixes

* keep myapp network alias so Caddy resolves the webapp ([#160](https://github.com/Public-Vinyl-Radio/groovenet/issues/160)) ([4bb805f](https://github.com/Public-Vinyl-Radio/groovenet/commit/4bb805f6011a13e95fc7dbbf5fcdd6de7ebf38f4))
* stop standalone build from tracing the whole project ([#159](https://github.com/Public-Vinyl-Radio/groovenet/issues/159)) ([befbe45](https://github.com/Public-Vinyl-Radio/groovenet/commit/befbe458ac07a5964a4e8be8be77b979a8e390ef))

## [0.1.4](https://github.com/Public-Vinyl-Radio/groovenet/compare/v0.1.3...v0.1.4) (2026-09-07)


### Features

* add update-available check to the About page ([#154](https://github.com/Public-Vinyl-Radio/groovenet/issues/154)) ([5bd9af7](https://github.com/Public-Vinyl-Radio/groovenet/commit/5bd9af7688fa8d98eeada8f2118d254cb4370948))

## [0.1.3](https://github.com/Public-Vinyl-Radio/groovenet/compare/v0.1.2...v0.1.3) (2026-09-07)


### Bug Fixes

* build webapp image from the runner stage (not migrator) ([#152](https://github.com/Public-Vinyl-Radio/groovenet/issues/152)) ([1657610](https://github.com/Public-Vinyl-Radio/groovenet/commit/16576107c39a29343a981f3b91f70fdc9fedbd38))

## [0.1.2](https://github.com/Public-Vinyl-Radio/groovenet/compare/v0.1.1...v0.1.2) (2026-09-06)


### Performance Improvements

* standalone webapp image, amd64-only builds, rename myapp to webapp ([#150](https://github.com/Public-Vinyl-Radio/groovenet/issues/150)) ([98c5d34](https://github.com/Public-Vinyl-Radio/groovenet/commit/98c5d34466a7edb4e3b6d57106cb9f60c6be3e7c))

## [0.1.1](https://github.com/Public-Vinyl-Radio/groovenet/compare/v0.1.0...v0.1.1) (2026-09-06)


### Features

* About page, GrooveNet favicon, and release versioning system ([#148](https://github.com/Public-Vinyl-Radio/groovenet/issues/148)) ([75cb5cd](https://github.com/Public-Vinyl-Radio/groovenet/commit/75cb5cd8f52505a9b98b10ecb5c8faa9b0227563))


### Bug Fixes

* cache pg Pool in production to prevent connection exhaustion ([78ea8d2](https://github.com/Public-Vinyl-Radio/groovenet/commit/78ea8d225e82378bc4de2fcb85076588ceb93738))
* **ci:** add yaml peer dep for npm ci lockfile sync ([875ba92](https://github.com/Public-Vinyl-Radio/groovenet/commit/875ba9227905a7ca4cab63e5ca451186aff6d143))
* stringify manifest releaseIds to prevent .replace() crash ([83394b9](https://github.com/Public-Vinyl-Radio/groovenet/commit/83394b991f09f1cdb7c98b5c04807c8ab2ae5d75))
* stringify manifest releaseIds to prevent .replace() crash ([1187758](https://github.com/Public-Vinyl-Radio/groovenet/commit/11877588b6dfab9f3718b157f7bf29d028c7fd55))
