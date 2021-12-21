# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [7.45.0] - 2021-12-21
### Removed
- Remove Sentry.

## [7.44.0] - 2021-06-30
### Added
- Hook `useRuntime` to replace `withRuntimeContext` HOC.

### Changed
- Upgrade React version to v16.12.0.

## [7.43.0] - 2021-05-20
### Changed
- React version from v16.4.2 to v16.9.0
- `prop-types` package version from v15.6.1 to 15.7.2.

## [7.42.1] - 2021-01-19
### Fixed
- Legacy extension components not re-rendering when the `locale` is updated.

## [7.42.0] - 2020-06-23
### Added
- Add support for root paths. It is necessary for legacy-extensions on stores with root path.

## [7.41.1] - 2020-04-28

## [7.41.0] - 2020-04-28
### Fixed
- Uses query as POST when hashing fails

## [7.40.1] - 2020-04-07
### Fixed
- Fix base uri when rendered inside iFrame and parent not in IO.

## [7.40.0] - 2019-09-18

## [8.64.0] - 2019-09-17
### Added
- Support for `__fold__` blocks, to be able to set what lies "below the fold".

## [8.63.0] - 2019-09-16
### Added
- Support for rendering AMP pages.

## [8.62.2] - 2019-09-12
### Fixed
- Fix the 'only lowercase URL segments for `store`' modification.

## [8.62.1] - 2019-09-12
### Fixed
- Only lowercase URL segments for `store`.

## [8.62.0] - 2019-09-12

## [8.61.0] - 2019-09-12
### Added
- Lowercase URL segments if they are not related to a `specificationFilter`.

## [8.60.2] - 2019-09-11
### Changed
- Stop encoding query.

## [8.60.1] - 2019-09-10

### Fixed
- Initialize SSE in dev workspaces.

## [8.60.0] - 2019-09-10

### Added
- Hot reload for blocks.

## [8.59.3] - 2019-09-10

### Fixed
- Add loading animation for client blocks.

## [8.59.2] - 2019-09-09
### Fixed
- Navigating back crashes if the server-side page was fetched with some querystring.

## [8.59.1] - 2019-09-06
### Fixed
- Navigation bug of invalid fetch use

## [8.59.0] - 2019-09-06
### Changed
- Adds fetch to render provider

## [8.58.1] - 2019-09-05
### Fixed
- Fix navigation skipping fetchNavigationPage

## [8.58.0] - 2019-09-04

## [8.58.0-beta] - 2019-09-04

## [8.57.2] - 2019-09-04
### Fixed
- Prevent the so-called accordion effect on root ExtensionPoints.

## [8.57.1] - 2019-09-03

## [8.57.0] - 2019-09-03

## [8.56.0] - 2019-09-03

## [8.55.2] - 2019-09-02

## [8.55.1] - 2019-09-02
### Fixed
- Properly memo TreePathContextProvider.

## [8.55.0] - 2019-08-29
### Changed
- Adds 100% of navigation to render server

## [8.54.0] - 2019-08-28
### Changed
- Add 50% of users to render navigation

## [8.53.1] - 2019-08-28
### Changed
- Deprecate render navigation due to bad CDN configuration

## [8.53.0] - 2019-08-28
### Fixed
- Fix bundled assets discovery.
### Changed
- Increase number of users to 50 navigating using render server

## [8.52.0] - 2019-08-27

## [8.51.0] - 2019-08-27

## [8.50.0] - 2019-08-23
### Added
- Pool to prefetch pages
- Delay to execute prefetch pages
- Add querystring `__disablePrefetchPages`

## [8.49.0] - 2019-08-22
### Changed
- Prepare to use comma instead of semicolon as bundle files separator

## [8.48.3] - 2019-08-21
### Fixed
- Temporarily reverted changes made in #370 (8.46.0) because of problems rendering pages in IE11.

## [8.48.2] - 2019-08-19
### Fixed
- Lint errors

### Added
- Husky to prevent commits with lint errors

## [8.48.1] - 2019-08-19

## [8.48.0] - 2019-08-13
### Added
- Support to assets bundle

## [8.47.0] - 2019-08-12
### Added
- Locale as a querystring on final request URI

## [8.46.0] - 2019-08-12
### Added
- Support for rendering AMP pages.

## [8.45.3] - 2019-08-06

### Fixed
- Prevent extensions overwriting after an `updateRuntime`

## [8.45.2] - 2019-08-06
### Fixed
- undefined@undefined in Apollo cache

## [8.45.1] - 2019-08-05
### Fixed
- Add displayName to ErrorBoundary HOC.

## [8.45.0] - 2019-08-05
### Changed
- Added error boundaries on the ExtensionPoint component, limiting crashes to the component instead of breaking most of the page.
- Hide errors on production mode.

## [8.44.1] - 2019-08-02
### Fixed
- Enhanced `NoSSR` detection.

## [8.44.0] - 2019-07-31

### Added

- Add support for GraphQL `Unions` and `Interfaces`in ApolloClient's cache. This is done by using `IntrospectionFragmentMatcher` instead of `HeuristicFragmentMatcher` (https://www.apollographql.com/docs/react/advanced/fragments/).

## [8.43.0] - 2019-07-30
### Added
- Separate admin language from store language

## [8.42.8] - 2019-07-29
### Changed
- `ExtensionPoint` render is interrupted earlier if no extension is found, and refrains from rendering `ExtensionPointComponent` if so.

### Fixed
- `Loading` gets its block props from context again, thus fixing issue where it wouldn't appear if inserted on a component.

## [8.42.7] - 2019-07-26
### Changed
- Omit `/app/` in href for links inside iframe.

## [8.42.6] - 2019-07-25
### Fixed
- Fix issue where client-only blocks would render under the wrong parent element.

## [8.42.5] - 2019-07-24
### Added
- Add rootPath to navigate options

## [8.42.4] - 2019-07-23
### Fixed
- Revert behaviour introduced in 8.36.1 regarding templates from `maps`. It now gets the template from the first parameter of the `map` query string.

## [8.42.3] - 2019-07-15

### Fixed

- Context props passed by `MaybeContext`.

## [8.42.2] - 2019-07-15
### Fixed
- Warning of deprecated import of `createBrowserHistory` of `history` library.

## [8.42.1] - 2019-07-12

### Changed
- Reduce number of `Context` created by `ExtensionPoint` to improve mount time.

## [8.41.3] - 2019-07-11
### Fixed
- Fix canonical replacement using rootPath

## [DEPRECATED] [8.42.0] - 2019-07-11

## [8.41.2] - 2019-07-11

## [8.41.1] - 2019-07-11

## [8.41.0] - 2019-07-10
### Added
- `useSSR` hook, as a counterpart for the `NoSSR` component.
- `phone` on the RenderHints type.

### Changed
- Use internal `NoSSR` component logic instead of using the `react-no-ssr` package.

## [8.40.3] - 2019-07-10

### Fixed
- Pass `block.title` to extensions.

## [8.40.2] - 2019-07-05

## [8.40.1] - 2019-07-02
### Fixed
- Support for optional parameters in routes containing `map`

## [8.40.0] - 2019-07-01
### Add
- Add hasContentSchema information to extensions

## [8.39.4] - 2019-07-01
### Fixed
- Width of the Preview component under the adjusted store wrapper.

## [8.39.3] - 2019-06-28

### Fixed
- Hash navigation in Link component.

## [8.39.2] - 2019-06-27
### Fixed
- Refrain from rendering Preview if its height is 0.

## [8.39.1] - 2019-06-27

### Fixed
- Build assets with new builder hub.

## [8.39.0] - 2019-06-26
### Changed
- Change routing precedence algorithm to match the server-side one.

## [8.38.3] - 2019-06-26
### Fixed
- Avoid recreating React elements when block has composition children.

## [8.38.2] - 2019-06-21

## [8.38.1] - 2019-06-18

### Changed

- Upgrade react-apollo, apollo-client and apollo-cache-inmemory

## [8.38.0] - 2019-06-14
### Added
- Strategy to unpack compressed `pages-graphql` extensions

## [8.37.3] - 2019-06-14
### Fixed
- Prevent graphQLErrorsStore from swallowing up errors when exception is undefined

## [8.37.2] - 2019-06-14

## [8.37.1] - 2019-06-13

### Changed
- Revert setting `data-src` and removing `src` for every image (but continue supporting lazysizes as opt-in).

## [8.37.0] - 2019-06-13
### Added
- Sets every URI scope to `private` whenever the workspace's root interface declarer has a `requiresAuthorization` setting with value `true`.

## [8.36.3] - 2019-06-13
### Fixed
- Fix data-src attribute for lazy image loading.

## [8.36.2] - 2019-06-13
### Fixed
- Remove negative values for preview width and height.

## [8.36.1] - 2019-06-13

### Fixed

- Fix navigation to a URL that have a search term as the first path, followed by the subcategory paths.

## [8.36.0] - 2019-06-13

### Added
- Support for lazy loading of images using lazysizes
- Defer render start for quicker onload

## [8.35.5] - 2019-06-13

### Fixed

- Make it possible to have a link with attribute `rel="noopener nofollow"`.

## [8.35.4] - 2019-06-13

### Fixed

- Error of trying to setState in a unmounted component.

## [8.35.3] - 2019-06-13
### Changed
- Upgrades render-session

## [8.35.2] - 2019-06-12

## [8.35.1] - 2019-06-11

## [8.35.0] - 2019-06-11

## [8.35.0-beta] - 2019-06-11

## [8.34.6] - 2019-06-10

## [8.34.5] - 2019-06-10

## [8.34.4] - 2019-06-07

## [8.34.3] - 2019-06-06
### Changed
- Change BuildStatus animation from SMIL-based to CSS-based, for performance.

## [8.34.2] - 2019-06-06
### Changed
- Downgraded `query-string` to version 5.x, for IE11 support. (https://www.npmjs.com/package/query-string#install)

## [8.34.1] - 2019-06-03

## [8.34.0] - 2019-06-03

## [8.32.4] - 2019-05-29
### Fixed
- Add skipCache to updateRuntime

## [8.32.3] - 2019-05-27 [YANKED]

### Changed
- Removed replaceExtensionsWithDefault on page change.

## [8.32.2] - 2019-05-27

### Fixed
- Error when img `src` attribute isn't a string.

## [8.32.1] - 2019-05-27

## [8.32.0] - 2019-05-27

### Added
- Link to catch GraphQL errors, store and show them when a component crashes.
- Sending `domain` and `page` to Sentry as tags.

### Changed
- Hide some runtime keys before sending it to Sentry.
- Broke the runtime extra sent to Sentry into smaller `runtime.${key}` extras.
- Inlined sentry config to remove one file from pages fetching phase.

### Fixed
- Global typings.

## [8.31.1] - 2019-05-25

### Removed
- scopeMessages.

## [8.31.0] - 2019-05-24
### Added
- Support metatags for custom routes.

## [8.30.0] - 2019-05-21
### Added

- Method to add messages to Runtime (`addMessages`).
- `addMessages` and `messages` to Render context.

### Changed

- `sendInfoFromIframe` signature.
- `updateExtension` and `updateRuntime` now await for `setState` to be finished.

### Deprecated

- `RenderProvider`'s `updateMessages` private method.
- `sendInfoFromIframe`'s 4th argument (`setMessages`).

## [8.29.3] - 2019-05-20
### Fixed
- Fixed `paramsJSON` when refetching page due to `updateRuntime`.

## [8.29.2] - 2019-05-20
### Fixed
- Linting errors.

## [8.29.1] - 2019-05-17

## [8.29.0] - 2019-05-16
### Added
- Use `?map` to do route matching.
- Add first class support to canonical routes.

## [8.28.0] - 2019-05-10
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
