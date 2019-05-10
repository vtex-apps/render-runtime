# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Added
- Scope messages. 

## [8.27.0] - 2019-05-09
### Fixed
- Extracted query params from `to` path, for the query object. 

## [8.26.0] - 2019-05-09

## [8.25.1] - 2019-05-09
### Fixed
- Checks for invalid params in route and throws a warning.

## [8.25.0] - 2019-05-08
### Added
- Added preview support for top-level blocks.

## [8.24.0] - 2019-05-07

### Added
- Added support for `rootPath` property in runtime, which causes links and navigation to be scoped by a prefix (e.g. when serving your store from a specific path in a domain). See https://github.com/vtex/render-root-path-example

## [8.23.0] - 2019-05-07

## [8.22.0] - 2019-05-03
### Added
- Template blocks can now configure their context providers.

## [8.21.0] - 2019-05-03

## [8.20.0] - 2019-05-03

## [8.19.0] - 2019-04-24
### Added
- Export useTreePath hook.

## [8.18.4] - 2019-04-24

## [8.18.3] - 2019-04-18
### Changed
- Updated React packages to version 16.8.6

## [8.18.2] - 2019-04-12
### Added
- Support for `scrollOptions` on `setQuery`.

### Changed
- Removing `navigationRoute` check for the back button functionality.

## [8.18.1] - 2019-04-11
### Changed
- Allow hash on direct children regexp

## [8.18.0] - 2019-04-10
### Added
- Export ChildBlock and useChildBlock APIs, without unstable flag.
- ChildBlock now returns the props of the block, inserted via the `blocks.json` file.
- Send props inserted via the `blocks.json` file to the `props` object of each child (when `composition` is set to `children`).
- Export Block component, which is an alias of the ExtensionPoint component, and is now the preferred nomenclature.

### Deprecated
- Unstable__ChildBlock and useChildBlock__unstable.
- ExtensionPoint component--prefer using the Block component, which has exactly the same API and functionality.

## [8.17.4] - 2019-04-05
### Changed
- Update vtex-tachyons to 3.1.0

## [8.17.3] - 2019-04-04

## [8.17.2] - 2019-04-02
### Changed
- Make the query string part of the `href` in Render's Link component.

## [8.17.1] - 2019-04-02
### Added
- Support for `replace` option in setQuery for using that method in navigation.

## [8.17.0] - 2019-03-29
### Added
- Add setQuery method for changing query string without remounting.

## [8.16.3] - 2019-03-27

### Changed
- Changed from `unstable__layoutMode` to `composition`.

## [8.16.2] - 2019-03-27

- Add support to disable user blocks QueryString `disableUserLand`

## [8.16.1] - 2019-03-25

### Fixed

- `ExtensionPoint` now does a deep merge of props.

## [8.16.0] - 2019-03-22

### Added

- Add experimental features `useChildBlock__unstable` and `Unstable__ChildBlock`. It allows checking whether a child block was included or not.

## [8.15.0] - 2019-03-21
### Added
- Added support for `unstable__layoutMode`.

## [8.14.0] - 2019-03-21
### Added
- `TrackEventsWrapper` to add event listener based in track field of interface

## [8.13.2] - 2019-03-20

### Changed

- Change ErrorPage component to use CSS Modules

## [8.13.1] - 2019-03-15

## [8.13.0] - 2019-03-15

## [8.12.0] - 2019-03-13
### Changed
- Update Apollo Client and React Apollo.

## [8.11.3] - 2019-03-12
### Fixed
- Fixed bug where functions would be wrapped around components on HMR, thus losing the ability to be called.

## [8.11.3-beta] - 2019-03-12

## [8.11.2] - 2019-03-01

## [8.11.1] - 2019-03-01

### Removed
- Removed default spinners when the component is loading

## [8.11.0] - 2019-02-28
### Changed
- Improve error page with json viewer and remove crazy red box

## [8.10.0] - 2019-02-28
### Added
- Avoid feching navigation data if route declares `allowConditions: false`

## [8.9.2] - 2019-02-28
### Changed
- Stop creating `<span>` when using react intl's `<FormattedMessage>`

## [8.9.1] - 2019-02-27
### Changed
- React version from v16.8.0 to v16.8.3

## [8.9.0] - 2019-02-27
### Added
- query to Render Runtime Context.

## [8.8.1] - 2019-2-22
### Fixed
- Fix initial history replacement

## [8.8.0] - 2019-2-22
### Added
- Update `pageContext` on navigation
- Extension now has a content field that is merged with block component props.

## [8.7.1] - 2019-02-21

## [8.7.1-beta] - 2019-02-20

## [8.7.0] - 2019-02-19

- Add `renderExtension` function to render runtime

## [8.6.4] - 2019-02-15
### Fixed
- Escaping string that is used to make dynamic Regex in `isDirectChild`.

## [8.6.3] - 2019-02-13

### Fixed
- Check if `props.style` is `writable` before assigning

## [8.6.2] - 2019-2-7
### Changed
- `LayoutContainer` now gets elements to be rendered from `blocks` directly.

## [8.6.1] - 2019-02-06
### Added
- `replace` option to use `history`'s replace instead of `push`.

## [8.6.0] - 2019-02-06
### Added
- `goBack` method to the provided context.

## [8.5.0] - 2019-02-06

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
