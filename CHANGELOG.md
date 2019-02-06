# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Added
- `goBack` method to the provided context.

## [8.4.1] - 2019-02-06
### Removed
- RC external script.

## [8.4.0] - 2019-02-06
### Added
- Add support to React Hooks
- Create hook `useRuntime`.

## [8.3.2] - 2019-02-06
### Fixed
- Props `query` and `params` not being passed to `before` and `after` blocks.

## [8.3.1] - 2019-02-05

## [8.3.0] - 2019-02-01

## [8.2.0] - 2019-01-28
### Removed
- `MaybeAuth` component.

## [8.1.0] - 2019-01-25
### Added
- Apollo Link State support.

## [8.0.6] - 2019-1-22
### Changed
- Loading svg is loaded by Icon Pack. 
- Change position of the building indicator when it is hovered.

## [8.0.5] - 2019-1-21

## [8.0.4] - 2019-01-21
### Fixed
- Add the `crossOrigin` attribute **only to img tags with src from vteximg**.

## [8.0.3] - 2019-1-18
### Changed
- Get context as extension property instead of `__context`.
- Add wrappers when loading preview

## [8.0.2] - 2019-01-18
### Changed
- Now, import from `render` is `vtex.render-runtime`.

## [8.0.1] - 2019-1-17

## [8.0.0] - 2019-1-16
### Changed
- Adapt to use new blocks language to build pages.
- Remove support to legacy extensions.
- Remove support for old pages protocol.

## [7.38.7] - 2018-12-26
### Fixed
- Unable to render multiple instances of the same component when navigating client-side.

## [7.38.6] - 2018-12-26
### Fixed
- Stop doing CORS for every image.

## [7.38.5] - 2018-12-26

### Changed
- Upgraded vtex-render-session to fix error messages.

## [7.38.4] - 2018-12-21

## [7.38.3] - 2018-12-21
### Fixed
- Add the `crossOrigin` attribute to preload scripts/styles too.

## [7.38.2] - 2018-12-21
### Fixed
- Add the `crossOrigin` attribute to scripts added to the page.

## [7.38.1] - 2018-12-21
### Fixed
- Removed invalid property on anchor tag.

## [7.38.0] - 2018-12-17
### Changed
- Changes graphql routing pattern from `/graphql/public` to `/public/graphql`

## [7.37.3] - 2018-12-14
### Fixed
- Add again the `crossorigin` attribute now that the store service worker cleans old opaque responses.

## [7.37.2] - 2018-12-13
### Fixed
- Remove crossOrigin attribute from img

## [7.37.1] - 2018-12-13
### Changed
- Add the `crossorigin` attribute to the `img` tags with absolute source path

## [7.37.0] - 2018-12-13
### Changed
- Session related functions as runtime externals [check this repo](https://github.com/vtex-apps/render-session)

## [7.36.3-beta.0] - 2018-12-12

## [7.36.3-beta] - 2018-12-12

## [7.36.2] - 2018-12-10

## [7.36.2-beta.0] - 2018-12-06

## [7.36.2-beta] - 2018-12-05

## [7.36.1] - 2018-12-04

## [7.36.0] - 2018-12-04

## [7.36.0-beta.0] - 2018-12-04

## [7.36.0-beta] - 2018-12-04

## [7.35.0] - 2018-12-03

## [7.34.3] - 2018-12-03
### Fixed
- Fix workspace not being passed when changing url host to vteximg

## [7.34.2] - 2018-12-03

### Changed
- Upgrade vtex-tachyons to 2.10.0, to include size tokens

## [7.34.1] - 2018-12-02

## [7.34.0] - 2018-12-02

## [7.34.0-beta.1] - 2018-12-02

## [7.34.0-beta.0] - 2018-12-02
### Changed
- Update React & React DOM to `v16.6.1`.
- Defer rc script to avoid blocking assets (last one!).

### Added
- Fetch components assets from `vteximg`.
- Make sure links with target="_blank" have rel="noopener"

## [7.34.0-beta] - 2018-12-02

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
