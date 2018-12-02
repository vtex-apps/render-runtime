# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Changed
- Update React & React DOM to `v16.6.1`.

### Added
- Fetch components assets from `vteximg`.

## [7.33.0] - 2018-12-01

## [7.32.0] - 2018-11-30

## [7.32.0-beta] - 2018-11-30

## [7.31.0] - 2018-11-30

## [7.30.0] - 2018-11-30

## [7.29.1] - 2018-11-22

## [7.29.0] - 2018-11-22
### Added
- Add `baseElementId` to navigate to allow scroll relative to an element.

## [7.28.5] - 2018-11-16

## [7.28.4] - 2018-11-16

## [7.28.3] - 2018-11-14
### Fixed
- Avoid `MaybeAuth` navigate to the login page when it is already navigating to it.

## [7.28.2] - 2018-11-08

## [7.28.1] - 2018-11-07
### Added
- **`RenderProvider`**
 - Add `this.sendInfoFromIframe` call to `setState` callbacks after locale update.

### Fixed
- **`RenderProvider#getCustomMessage`**
  - Considers `WrappedComponent` when getting custom message.

## [7.28.0] - 2018-11-07

## [7.27.4] - 2018-10-22

## [7.27.3] - 2018-10-19

## [7.27.2] - 2018-10-16

## [7.27.1] - 2018-10-05

## [7.27.0] - 2018-10-04

## [7.26.0] - 2018-10-2

## [7.25.3] - 2018-09-30

## [7.25.2] - 2018-09-30

## [7.25.1] - 2018-09-30

## [7.25.0] - 2018-09-30

## [7.24.0] - 2018-09-30

## [7.23.0] - 2018-09-26

## [7.22.6] - 2018-09-26

## [7.22.5] - 2018-09-25
### Fixed
- Avoid making prefetch of a page that doesn't exist.

## [7.22.4] - 2018-09-21

## [7.22.3] - 2018-09-21
### Fixed
- Infinity calls when using `fetchWithRetry` in `initializeSession` and `patchSession`.

## [7.22.2] - 2018-9-19

## [7.22.1] - 2018-9-17

## [7.22.0] - 2018-09-06
### Changed
- Update `MaybeAuth` to work just by the session.

## [7.21.2] - 2018-9-6

## [7.21.1] - 2018-9-5

## [7.21.0] - 2018-9-3

## [7.20.8] - 2018-08-30
### Fixed
- Allow route change to clear components errors.

## [7.20.7] - 2018-08-27

## [7.20.6] - 2018-8-24

## [7.20.5] - 2018-8-22

## [7.20.4] - 2018-8-22

## [7.20.3] - 2018-8-22

## [7.20.2] - 2018-8-21

## [7.20.1] - 2018-8-21

## [7.20.0] - 2018-08-21

## [7.19.0] - 2018-08-17

## [7.18.1] - 2018-8-15

## [7.18.0] - 2018-08-06

## [7.17.1] - 2018-08-01

## [7.16.6] - 2018-07-23

## [7.16.5] - 2018-7-20

## [7.16.4] - 2018-7-19

## [7.16.1] - 2018-07-18
### Added
- Uses cacheId to cache

## [7.16.0] - 2018-7-18

## [7.15.2] - 2018-07-17
### Fixed
- Fix link props being directly passed to `a` tag.

## [7.12.6] - 2018-07-10

## [7.12.0] - 2018-07-09
### Added
- Auth treatment and redirect to the login page.
- Loading component to Render Exports

## [7.11.3] - 2018-6-21
### Removed
- Remove support for root extension without component.

## [7.11.2] - 2018-6-21
### Fixed
- Fix sorting direct children with numeric values.
