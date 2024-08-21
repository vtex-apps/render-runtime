# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [8.134.8] - 2024-08-21

### Added

- Additions from previous beta release.

## [8.134.8-beta] - 2024-08-20

### Added

- Method to extract keys from error objects recursively so we can index them on Sentry.

## [8.134.7] - 2024-08-19

### Added

- Additions from previous beta release.

### Changed

- Changes from previous beta release.

## [8.134.7-beta] - 2024-08-19

### Added

- Mechanism to programatically log events to Sentry via query string (`?forceLogs=true`).

### Changed

- Moved all runtime information retrieval from the error page to the Sentry `beforeSend` middleware.

## [8.134.6] - 2024-08-13

### Added

- Changes from 8.134.6-beta.

## [8.134.6-beta] - 2024-08-13

### Added

- Runtime information retrieval fallback when logging errors.

## [8.134.5] - 2024-08-12

### Added

- Admin information to the sentry capture exception events.

### Fixed 

- `isAdmin` invalid regular expression for Safari version 15.6 or less.

## [8.134.5-beta] - 2024-08-12

## [8.134.4] - 2024-07-25

## [8.134.4-beta] - 2024-07-19

### Changed

- Manully bump Render Runtime to an unreleased beta version.

## [8.134.3-beta] - 2024-07-19

### Added

- Instrument Admin environment (all Render Admin Apps included) with Sentry.

## [8.134.2] - 2023-09-26

### Added
- Added a className to Lazy Render

## [8.134.1] - 2023-09-07

### Fixed
- Return to previous scroll position during back button navigation

## [8.134.0] - 2023-08-10

## [8.133.2] - 2023-06-07
### Removed
- `withPerformanceMeasures` function due to splunk usage.
- Splunk link in error page.

## [8.133.1] - 2023-03-30

### Fixed

- Add tachyon prefix

## [8.133.0] - 2022-12-22

- Added new tachyons className for wrapped component.

## [8.132.6] - 2022-06-06

## Reverted
- Rollback react version to `16.0.9`.

## [8.132.5] - 2022-05-26

### Changed
- Update react version to `17.0.2`.

## [8.132.4] - 2022-03-17
### Changed
- Updated lazysizes library

## [8.132.3] - 2021-10-06
### Fixed
- Link and PrefetchLink props.

## [8.132.2] - 2021-09-29
### Fixed
- Prevents unnecessary rerender on `withDevice` HOC.

## [8.132.1] - 2021-09-28
### Changed
- Increase the default performance measurement sampling to 0.75%, and, for specific accounts and pages, to 4%.

## [8.132.0] - 2021-09-23
### Added
- Performance measurements on Splunk for 0.5% of views.

## [8.131.1] - 2021-09-06
### Fixed
-  `rel` prop received by `Link` component not being added to the rendered `<a>` tags.

## [8.131.0] - 2021-08-02
### Added
- `rel` prop to `Link` component for better SEO.

## [8.130.0] - 2021-06-28
### Changed
- Link `params` that starts with `__` are no longer considered during path transformations. They can be used as alternatives to query params.

## [8.129.0] - 2021-06-24
### Added
- `window.__HAS_HYDRATED__` flag, intended for lazy pixels, but which can be used elsewhere.

## [8.128.4] - 2021-04-22

## [8.128.3] - 2021-04-19
### Fixed
- Double encoding while generating paths

## [8.128.2] - 2021-03-18

### Fixed
- CSS conflicts after a hot reload. 

## [8.128.1] - 2021-03-17

### Fixed
- Prefetch does not work when the document has already been loaded.

## [8.128.0] - 2021-03-12

### Added
-  Custom callback param to the localesChanged event.

## [8.127.0] - 2021-03-10

### Added
- `pages` and `route` to `useRuntime` types definition.

### Fixed
- `RenderContext` and `withRuntimeContext` exported types definition.

## [8.126.11] - 2021-02-02

### Fixed
- Use props `children` in slots if slot children is empty.

## [8.126.10] - 2021-01-26

### Fixed
- Disable hydrate-on-view in the site editor. 

## [8.126.9] - 2021-01-21
### Fixed
- Disable folding in the site editor. 

## [8.126.8] - 2021-01-21
### Fixed
- Fix wrong binding content being loaded with prefetch enabled.

## [8.126.7] - 2021-01-15
### Fixed
- Fix wrong request when trying to update device blocks with rootPath.

## [8.126.6] - 2021-01-11
### Fixed
- Fix components conflict check.

## [8.126.5] - 2020-12-29
### Added
- Updates render-session to 1.9.2, which uses the rootPath when calling VTEX ID.

## [8.126.4] - 2020-12-07
### Fixed
- GraphQL client link and assets for pages served through Janus.

## [8.126.3] - 2020-12-03
### Changed
- Fallbacking to `scope: private` on GraphQL queries whenever we miss the queries's map cache.

## [8.126.2] - 2020-12-02 [YANKED]
### Fixed
- GraphQL client link for pages served through Janus.

## [8.126.1] - 2020-12-01
### Fixed
- Types of `useChildBlock` and `ChildBlock`.

## [8.126.0] - 2020-11-24
### Added
- Expose CSS classes to SSR.

## [8.125.2] - 2020-11-24
### Added
- `deviceInfo` to `useRuntime` types.
- Documentation of render-runtime exports.

### Removed
- `amp`, `device`, `platform`, `publicEndpoint`, and `route` from `useRuntime` types.

## [8.125.1] - 2020-11-23
### Fixed
- Issue where `after` pixels would be "lazy rendered" if `enableLazyFooter` was enabled, which would cause both functional and layout issues.

## [8.125.0] - 2020-11-21
### Added
- Support for `__fold__` blocks inside other blocks.

## [8.124.4] - 2020-11-21
### Fixed
- Trigger interaction event on `viewDetection` if the user has scrolled the page before JS being initialized.

## [8.124.3] - 2020-10-30
### Fixed
- Add generic prop typing to `ExtensionPoint`.

## [8.124.2] - 2020-10-23
### Fixed
- Styles update event not being emitted.

## [8.124.1] - 2020-10-21
### Fixed
- Exported type of `canUseDOM`.
- Add missing fields to type `culture`.

## [8.124.0] - 2020-10-21
### Fixed
- Exported types.

## [8.123.3] - 2020-10-20

### Fixed
- Make new realease without the code introduced by version v8.123.0.

## [8.123.2] - 2020-10-20
### Fixed
- `src` of lazy images not being updated when the `src` prop changes.

## [8.123.1] - 2020-10-14
### Fixed
- Look for `hasContentSchema` to check if a block has a content schema.

## [8.123.0] - 2020-10-13 [YANKED]

### Added
- Add the loading bar when redirecting to the checkout.

## [8.122.2] - 2020-10-06
### Changed
- Remove sentry (it is not being used anymore).

## [8.122.1] - 2020-09-25
### Fixed
- Wait async scripts to render error page

## [8.122.0] - 2020-09-23
### Added
- Support for lazy rendering the page footer via `enableLazyFooter` setting.

### Changed
- Fold inserts empty divs inside the page for spacing, instead of stretching the overall page.
- Fold uses view detection on each concealed block, instead of showing them all at once on scroll.

## [8.121.0] - 2020-09-21
### Added
- Add support to react concurrent mode.

## [8.120.0] - 2020-09-15
### Added
- Async scripts support: wait the execution of the async scripts to start rendering.

## [8.119.0] - 2020-09-10
### Added
- Allows preloading images via the `data-vtex-preload` attribute.

## [8.118.0] - 2020-09-10
### Changed
- Run hydrate from apollo cache separately from the React one, reducing total blocking time.

## [8.117.0] - 2020-09-09
### Fixed
- Fix lazy JSON parse.
### Changed
- Parse queryData separately.

## [8.115.0] - 2020-09-07
### Added
- Enable loading `__RUNTIME__` lazily.

## [8.114.1] - 2020-09-06
### Changed
- Memoize blocks children so they only re-render when props change.

## [8.114.0] - 2020-09-06
### Changed
- Blocks for different devices are loaded lazily if the screen resizes to their breakpoints.
- Provides deviceInfo on runtime context.

## [8.113.0] - 2020-09-06
### Added
- Check concatenated styles to decide on downloading new ones.

## [8.112.2] - 2020-09-06
### Fixed
- Prevents setting querystring values to `undefined`
- Prevents setting workspace to `undefined`
- Persists workspace set via querystring
- Prevents overriding workspaces already set on `Link`s

## [8.112.1] - 2020-09-05
### Fixed
- Keeps workspace during navigation if it's set via querystring.

## [8.112.0] - 2020-08-20
### Added
- Updates render-session to 1.9.1, which calls VTEX ID refresh token route before Session.

## [8.111.3] - 2020-08-20
### Changed
- Prevents rerendering caused by prefetch initialization

## [8.111.2] - 2020-08-20
### Changed
- Simplified image-blinking prevention on partial hydration.

## [8.111.1] - 2020-07-24
### Changed
- Fallback to server-side navigation when the new page components conflict with the loaded components.

## [8.111.0] - 2020-07-08
### Added
- Check channelPrivacy to decide on query scope.

## [8.110.0] - 2020-07-01
### Added
- `unveilhooks` lazysizes plugin, which allows lazyloading background images.

### Changed
- Upgraded lazysizes.

## [8.109.0] - 2020-06-25
### Changed
- Make prefetch be opt in by turning on vtex.store setting `enablePrefetch`.

## [8.108.0] - 2020-06-24
### Changed
- Images on `before` and `after` (i.e. header and footer) are loaded lazily.

## [8.107.0] - 2020-06-17
### Fixed
- Implement promise queue and finish prefetch.

## [8.106.0] - 2020-06-17
### Changed
- Change uncritical styles injection strategy.

## [8.105.0] - 2020-06-12
### Added
- Adds `appSettings` prop to blocks that have their settings exposed on `__RUNTIME__`.

## [8.104.3] - 2020-06-09
### Fixed
- Issue where an infinite loading would happen when navigating to 404 pages.

## [8.104.2] - 2020-06-05
### Fixed
- Prevent setQuery method from ever changing the current path when calling navigate.

## [8.104.1] - 2020-06-05
### Fixed
- On navigation, don't preprend rootpath if destination is to a path that already starts with rootpath.

## [8.104.0] - 2020-06-03
### Changed
- Stop overriding native Intl now we have full-icu on nodejs.

## [8.103.1] - 2020-06-01
### Changed
- Use our own LRUCache implementation to avoid issues with ie11.

## [8.103.0] - 2020-06-01
### Changed
- Replace `url` module import with native `window.URL` imeplementation.

## [8.102.1] - 2020-05-20
### Changed
- Turn prefetch OFF for now.

## [8.102.0] - 2020-05-19
### Added
- Prefetch logic, hooks and context.

## [8.101.0] - 2020-05-18

## [8.100.5] - 2020-05-18
### Fixed
- Issue with Apollo Devtools turning up blank.

## [8.100.4] - 2020-05-07
### Fixed
- Issue that would cause React to not run hydration on some (mostly old) browsers.

## [8.100.3] - 2020-05-07
### Changed
- Adapt tachyons hot reload for multiple links in document.

## [8.100.2] - 2020-05-05
### Fixed
- Let runtime to be used inside an iframe.

## [8.100.1] - 2020-04-29
### Fixed
- Avoid phantom cached query strings

## [8.100.0] - 2020-04-28
### Fixed
- PersistedQueryNotFoundError
  - Adds query to request when persisted query is not found to avoid PersistedQueryNotFoundError from graphql-server
  - Uses POST on those requests
  - Throws error in development when persisted query is not found

## [8.99.1] - 2020-04-24
### Fixed
- Always use POST in b2b scenarios

## [8.99.0] - 2020-04-06
### Added
- Expose `useExperimentalLazyImagesContext`

## [8.98.2] - 2020-04-06
### Fixed
- Issue where partial hydration content below regular `__fold__` would be loaded immediately.

## [8.98.1] - 2020-04-02
### Fixed
- Update render-session: fix malfomed session URL.

## [8.98.0] - 2020-03-30
### Added
- `useRuntime` at `react/components/` folder so it's types are generated.

## [8.97.2] - 2020-03-26
### Fixed
- Issue where components optimised for partial hydration wouldn't appear on the CMS.

## [8.97.1] - 2020-03-24
### Fixed
- Fix critical style querySelector.

## [8.97.0] - 2020-03-24
### Added
- Handle uncritical assets loading.

## [8.96.1] - 2020-03-20
### Fixed
- Issue where it would try to load a missing Extension on navigation.

## [8.96.0] - 2020-03-20
### Added
- Partial hydration for top-level components that have their `hydration` value set to `on-view`.

### Changed
- Extension loading moved from ExtensionPointComponent to ComponentLoader, with separate components for sync and async component loading.

## [8.95.1] - 2020-03-11

## [8.95.0] - 2020-03-10
### Fixed
- Site editor is not rendering some blocks due to the fold block.
### Removed
- Removes sentry from externals.json so this asset isn't rendered to the browser

## [8.94.0] - 2020-03-03
### Added
- Prop `preventRemount` on navigation.

## [8.93.2] - 2020-03-02
### Changed
- Update `prop-types` to `^16.7.2`.

## [8.93.1] - 2020-02-28
### Changed
- Revert page remounting temporarily (introduced in versions 8.91.3 and 8.91.5) due to bugs in edge cases.

## [8.93.0] - 2020-02-20
### Added
- `ExperimentalLazyImages` component
- Support for `__fold__.experimentalLazyImages` block.

## [8.92.0] - 2020-02-19
### Added
- Block inspector when `__inspect` flag is enabled.

## [8.91.5] - 2020-02-19
### Fixed
- Issue caused by the page remount fix on admin pages, where it wouldn't update properly on client side rendering.

## [8.91.4] - 2020-02-19
### Fixed
- Link not working with `target` different from the default value.

## [8.91.3] - 2020-02-18 [YANKED]
### Fixed
- Issue where page wouldn't remount if params changed within the same page.

## [8.91.2] - 2020-02-17
### Fixed
- Replace vteximg.com.br to vtexassets.com is possible.

## [8.91.1] - 2020-02-13
### Changed
- Fetch assets from 'vtexassets.com".

## [8.91.0] - 2020-02-06

## [8.90.5] - 2020-02-05
### Fixed
- Always set `vtex_binding_address` cookie. This should fix some binding switching issues.

## [8.90.4] - 2020-02-04
### Changed
- Prevent running `history.replace` on hydration if it's not needed, improving performance slightly.

## [8.90.3] - 2020-02-03
### Added
- Allowing the `extensions` argument from `fetchComponents` to be optional.
- Exposing the `fetchComponents` function to the RenderProvider.

## [8.90.2] - 2020-01-29
### Added
- `replace` prop to the `Link` component.

## [8.90.1] - 2020-01-24
### Fixed
- Returning an array with `undefined` to be rendered with apps that were rebuilt.

## [8.90.0] - 2020-01-23

## [8.89.0] - 2020-01-14
### Added
- Better binding switch handling

## [8.88.0] - 2020-01-06
### Added
- `renderWhileLoading` option to `withSession`

## [8.87.4] - 2020-01-06

### Changed
- Accumulate messages on RenderProvider state.

## [8.87.3] - 2020-01-02
### Fixed
- Prevent current page remount when performing a navigation

## [8.87.2] - 2019-12-26
### Fixed
- Added protection for multiple continuous navigates in RenderProvider that would cause crashes when redering components.

## [8.87.1] - 2019-12-26

### Changed
- Types for `Link` props

## [8.87.0] - 2019-12-26

## [8.86.1] - 2019-12-23
### Fixed
- Early fetch only components in extensions.

## [8.86.0] - 2019-12-20
### Changed
- Fetch all components assets as you navigate.

## [8.85.0] - 2019-12-20
### Added
- Bindings support

## [8.84.1] - 2019-12-18
### Changed
- Bump `vtex.render-session` version to 1.7.0.

## [8.84.0] - 2019-12-12
### Removed
- store URL normalisation logic

### Added
- navigation route normalisation hook that could be used by store

## [8.83.1] - 2019-12-12
### Fixed
- Case when only one polyfill was imported and promise would never resolve.

## [8.83.0] - 2019-12-12
### Changed
- Upgrade `react-intl` to major 3.x. Do our best to prevent breaking changes.

## [8.82.0] - 2019-12-04
### Added
- Support for CSS styles overrides hot reload.
- Support for Tachyons hot reload.

## [8.81.0] - 2019-12-04

## [8.80.0] - 2019-12-04
### Changed

- Preview skeleton's animation velocity and colors contrast.

## [8.79.1] - 2019-12-02
### Fixed
- Add client-side query to __RUNTIME__

## [8.79.0] - 2019-11-21

## [8.78.0] - 2019-11-21
### Fixed
- Prevents `preview` of type `text` from falling back to `box` if `width` is not defined.

### Removed
- Remove `paragraph` preview option, since it became obsolete.

## [8.77.0] - 2019-11-07
### Added
- Export LoadingContext component, to allow data fetchers display a loading status while the data is being loaded.
- LoadingWrapper to LayoutContainer, which displays a loading status while the components are being loaded.

### Changed
- ExtensionPointComponent content is not rendered while the component is being loaded.
- Uses a loading bar at the top of the page in lieu of an entire-page loader while the layout info is being loaded
- Preview now uses a CSS-based implementation.

## [8.76.0] - 2019-10-30
### Changed
- Revert the revert adding back the session ensurance for /segment and /private routes

### Fixed
- Fixed query split race condition with shared pointer

## [8.75.0] - 2019-10-29

## [8.74.0] - 2019-10-29

## [8.73.0] - 2019-10-29

## [8.72.6] - 2019-10-29
### Fixed
- Fix component's CSS being added after overrides.

## [8.72.5] - 2019-10-25
### Changed
- Remove Sentry

## [8.72.4] - 2019-10-25
### Fixed
- Fix route class renaming when navigating with render.

## [8.72.3] - 2019-10-25
### Changed
- Stop using `Consumer` in HOC that inject props, use hooks instead.

## [8.72.2] - 2019-10-24
### Added
- Add code to use vtexassets.com as image host. But it is disabled for now.

## [8.72.1] - 2019-10-23
### Fixed
- Fix breaking change in react-apollo@3.x.

## [8.72.0] - 2019-10-23
### Changed
- Upgraded `react-apollo` to 3.x major.

## [8.71.3] - 2019-10-21
### Fixed
- Fix issue with flexible search-page not showing when render-runtime is linked.

## [8.71.2] - 2019-10-18
### Fixed
- Change `render-container` route class upon navigation.

## [8.71.1] - 2019-10-16

### Fixed
- Issue when client-side navigation added a `?` to the path in `RenderProvider`'s state, making `updateRuntime` not work as expected.

## [8.71.0] - 2019-10-16
### Added
- Support for special links `mailto:` and `tel:` to the `<Link />` component.

## [8.70.0] - 2019-10-15
### Added
- Allow registering lazy entrypoints

## [8.69.0] - 2019-10-14
### Added
- Add `contentId` to opened extensions

## [8.68.0] - 2019-10-10

## [8.67.1] - 2019-10-10
### Fixed
- Improved navigation preview

## [8.67.0] - 2019-10-03
### Changed
- Update react from 16.8.6 to 16.9.0.

## [8.66.8] - 2019-10-01

## [8.66.7] - 2019-09-27

## [8.66.6] - 2019-09-26

## [8.66.6-beta] - 2019-09-26

### Fixed
- Do not prefetch pages if no pages were prefetched :upside_down_face:

## [8.66.5] - 2019-09-26

## [8.66.4] - 2019-09-25
### Changed
- Bump `render-session`.

## [8.66.3] - 2019-09-25
### Fixed
- Pass flag `disableSSQ` to AMP render.

## [8.66.2] - 2019-09-24
### Fixed
- Register react-amphtml global mocks that throw an explicitly error when trying to use AMP components on client-side or out of a `runtime.amp` check.

## [8.66.1] - 2019-09-24

## [8.66.0] - 2019-09-20
### Changed
- Stop bundling `react-amphtml` into index entrypoint.

## [8.65.0] - 2019-09-20
### Added
- Return `platform` on `runtime`.

## [8.64.1] - 2019-09-19
### Fixed
- Fix preview in navigation by using a generic preview component

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


[Unreleased]: https://github.com/vtex-apps/render-runtime/compare/v8.134.8-beta...HEAD
[8.134.4-beta]: https://github.com/vtex-apps/render-runtime/compare/v8.134.3-beta...v8.134.4-beta
[8.134.3-beta]: https://github.com/vtex-apps/render-runtime/compare/v8.134.2...v8.134.3-beta
[8.134.5-beta]: https://github.com/vtex-apps/render-runtime/compare/v8.134.4...v8.134.5-beta

[8.134.6-beta]: https://github.com/vtex-apps/render-runtime/compare/v8.134.5...v8.134.6-beta
[8.134.7-beta]: https://github.com/vtex-apps/render-runtime/compare/v8.134.6...v8.134.7-beta
[8.134.8-beta]: https://github.com/vtex-apps/render-runtime/compare/v8.134.7...v8.134.8-beta