import debounce from 'debounce'
import { canUseDOM } from 'exenv'
import { equals, merge, mergeWith, difference, path } from 'ramda'
import { History, UnregisterCallback, LocationListener } from 'history'
import PropTypes from 'prop-types'
import React, { Component, Fragment, ReactElement, Suspense } from 'react'
import { ApolloProvider } from 'react-apollo'
import { Helmet } from 'react-helmet'
import { IntlProvider } from 'react-intl'

import {
  fetchAssets,
  getLoadedImplementation,
  hasComponentImplementation,
  hotReloadOverrides,
  hotReloadTachyons,
  prefetchAssets,
} from '../utils/assets'
import {
  traverseComponent,
  traverseListOfComponents,
  fetchComponents,
  isConflictingLoadedComponents,
} from '../utils/components'
import { setCookie } from '../utils/cookie'
import {
  isSiteEditorIframe,
  RENDER_CONTAINER_CLASS,
  ROUTE_CLASS_PREFIX,
  routeClass,
} from '../utils/dom'
import { isEnabled } from '../utils/flags'
import { appendLocationSearch } from '../utils/location'
import {
  goBack as pageGoBack,
  mapToQueryString,
  navigate as pageNavigate,
  NavigateOptions,
  NavigationRouteChange,
  NavigationRouteModifier,
  queryStringToMap,
  scrollTo as pageScrollTo,
} from '../utils/pages'
import {
  fetchDefaultPages,
  fetchNavigationPage,
  fetchServerPage,
} from '../utils/routes'
import { TreePathContextProvider } from '../utils/treePath'
import BuildStatus from './BuildStatus'
import ExtensionManager from './ExtensionPoint/ExtensionManager'
import ExtensionPoint from './ExtensionPoint'
import { RenderContextProvider } from './RenderContext'
import type { RenderContext } from './RenderContext'
import RenderPage from './RenderPage'
import {
  getPrefetechedData,
  PrefetchContextProvider,
} from './Prefetch/PrefetchContext'
import { withDevice, WithDeviceProps, DeviceInfo, Device } from '../utils/withDevice'
import { ApolloClientFunctions } from '../utils/client'
import {
  ConfigurationDevice,
  ApolloClientType,
  RenderHistoryLocation,
  SetQueryOptions,
  RenderScrollOptions,
  ParsedServerPageResponse,
  ParsedPageQueryResponse,
  PageContextOptions,
} from '../typings/global'
import { RenderRuntime, Components, Extension } from '../typings/runtime'

import { logEvent } from '../utils/splunkLogger'

// TODO: Export components separately on @vtex/blocks-inspector, so this import can be simplified
const InspectorPopover = React.lazy(
  () =>
    new Promise<{ default: any }>((resolve) => {
      import('@vtex/blocks-inspector').then((BlocksInspector) => {
        resolve({ default: BlocksInspector.default.InspectorPopover })
      })
    })
)

interface Props {
  children: ReactElement<any> | null
  history: History | null
  root: string
  runtime: RenderRuntime
  sessionPromise: Promise<void>
  apollo: ApolloClientFunctions
}

export interface RenderProviderState {
  appsEtag: RenderRuntime['appsEtag']
  cacheHints: RenderRuntime['cacheHints']
  components: RenderRuntime['components']
  culture: RenderRuntime['culture']
  defaultExtensions: RenderRuntime['defaultExtensions']
  device: ConfigurationDevice
  deviceInfo: RenderRuntime['deviceInfo']
  extensions: RenderRuntime['extensions']
  inspect: RenderRuntime['inspect']
  messages: RenderRuntime['messages']
  page: RenderRuntime['page']
  pages: RenderRuntime['pages']
  preview: RenderRuntime['preview']
  production: RenderRuntime['production']
  query: RenderRuntime['query']
  settings: RenderRuntime['settings']
  route: RenderRuntime['route']
  loadedDevices: RenderRuntime['loadedDevices']
  loadedPages: Set<string>
  blocksTree?: RenderRuntime['blocksTree']
  blocks?: RenderRuntime['blocks']
  contentMap?: RenderRuntime['contentMap']
}

const SEND_INFO_DEBOUNCE_MS = 100
const DISABLE_PREFETCH_PAGES = '__disablePrefetchPages'

const noop = () => {}

const areOptionsDifferent = (a: NavigateOptions, b: NavigateOptions) => {
  return (
    a.page !== b.page ||
    a.query !== b.query ||
    a.to !== b.to ||
    a.rootPath !== b.rootPath ||
    !equals(a.params, b.params)
  )
}

const prependRootPath = (path: string, rootPath?: string) => {
  if (!rootPath) {
    return path
  }

  const maybeSlash = path.startsWith('/') ? '' : '/'
  return `${rootPath}${maybeSlash}${path}`
}

/** performance.measure throws an error if the markers don't exist.
 * This function makes its usage more ergonomic.
*/
function performanceMeasure(...args: Parameters<typeof window.performance.measure>): PerformanceMeasure | null | undefined | void {
  try {
    const measure = window?.performance?.measure?.(...args)
    if (measure as PerformanceMeasure | undefined) {
      return measure
    }
    // Fix for Firefox. Performance.measure doesn't return anything it seems,
    // but you can still get it via getEntriesByName and the like.
    const [name] = args ?? []
    if (typeof name !== 'string') {
      return null
    }
    const entriesByName = window?.performance?.getEntriesByName?.(name)
    const [firstEntry] = entriesByName ?? []
    if (!isPerformanceMeasure(firstEntry)) {
      return null
    }
    return firstEntry
  } catch (e) {
    return null
  }
}

function isPerformanceMeasure(value: any): value is PerformanceMeasure {
  if (value?.entryType === 'measure') {
    return true
  }
  return false
}

function logMeasures({ measures, account, device, page }: {
  measures: ReturnType<typeof performanceMeasure>[],
  account: string,
  device: Device,
  page: string
}) {
  // Log 1% of the views, or if __debugLogMeasures is present on the querystring
  if (Math.random() > 0.01 && !(window?.location?.search?.includes?.('__debugLogMeasures'))) {
    return
  }

  const measuresData:Record<string, number> = {}

  let hasValidMeasures = false
  for (const measure of measures) {
    if (!measure) {
      continue
    }
    hasValidMeasures = true
    if (measure.startTime > 0) {
      measuresData[`${measure.name}-start`] = measure.startTime
    }
    measuresData[`${measure.name}-duration`] = measure.duration
  }

  if (!hasValidMeasures) {
    return
  }

  const data = { ...measuresData, device, page}

  logEvent('Debug', 'Info', 'render', 'render-performance', data, account)
}

interface NavigationState {
  isNavigating: boolean
  lastOptions?: NavigateOptions
}

export class RenderProvider extends Component<
  Props & WithDeviceProps,
  RenderProviderState
> {
  navigationState: NavigationState = { isNavigating: false }
  public static childContextTypes = {
    account: PropTypes.string,
    addMessages: PropTypes.func,
    amp: PropTypes.bool,
    binding: PropTypes.object,
    blocks: PropTypes.object,
    blocksTree: PropTypes.object,
    contentMap: PropTypes.object,
    components: PropTypes.object,
    culture: PropTypes.object,
    defaultExtensions: PropTypes.object,
    // TODO: the prop "device" might be legacy. Figure out if it's still being used.
    device: PropTypes.string,
    // named "deviceInfo" to avoid conflicts with the possibly legacy "device".
    deviceInfo: PropTypes.shape({
      type: PropTypes.oneOf(['desktop', 'tablet', 'phone', 'unknown']),
      isMobile: PropTypes.bool,
    }),
    isMobile: PropTypes.bool,
    emitter: PropTypes.object,
    ensureSession: PropTypes.func,
    extensions: PropTypes.object,
    fetchComponent: PropTypes.func,
    fetchComponents: PropTypes.func,
    getSettings: PropTypes.func,
    goBack: PropTypes.func,
    hints: PropTypes.object,
    history: PropTypes.object,
    inspect: PropTypes.bool,
    messages: PropTypes.object,
    navigate: PropTypes.func,
    onPageChanged: PropTypes.func,
    page: PropTypes.string,
    pages: PropTypes.object,
    patchSession: PropTypes.func,
    platform: PropTypes.string,
    prefetchDefaultPages: PropTypes.func,
    addNavigationRouteModifier: PropTypes.func,
    prefetchPage: PropTypes.func,
    preview: PropTypes.bool,
    production: PropTypes.bool,
    publicEndpoint: PropTypes.string,
    query: PropTypes.object,
    renderMajor: PropTypes.number,
    rootPath: PropTypes.string,
    route: PropTypes.object,
    setDevice: PropTypes.func,
    setQuery: PropTypes.func,
    updateComponentAssets: PropTypes.func,
    updateExtension: PropTypes.func,
    updateRuntime: PropTypes.func,
    workspace: PropTypes.string,
    navigationRouteModifiers: PropTypes.object,
  }

  public static propTypes = {
    children: PropTypes.element,
    history: PropTypes.object,
    root: PropTypes.string,
    runtime: PropTypes.object,
  }

  public sendInfoFromIframe = debounce(
    (params?: { shouldUpdateRuntime?: boolean }) => {
      if (!isSiteEditorIframe) {
        return undefined
      }

      return window.top.__provideRuntime(
        this.getChildContext(),
        this.state.messages,
        (params && params.shouldUpdateRuntime) || false,
        // Deprecated
        this.updateMessages
      )
    },
    SEND_INFO_DEBOUNCE_MS
  )

  private rendered!: boolean
  private sessionPromise: Promise<void>
  private unlisten!: UnregisterCallback | undefined
  private apolloClient: ApolloClientType
  private hydrateApollo: ApolloClientFunctions['hydrate']
  private prefetchRoutes: Set<string>
  public navigationRouteModifiers: Set<NavigationRouteModifier>
  private navigationModifierOptions: Record<string, NavigationRouteChange>
  private fetcher: GlobalFetch['fetch']

  public constructor(props: Props & WithDeviceProps) {
    super(props)
    const {
      appsEtag,
      binding,
      blocks,
      blocksTree,
      cacheHints,
      contentMap,
      culture,
      messages,
      components,
      exposeBindingAddress,
      extensions,
      isJanusProxied,
      pages,
      page,
      query,
      production,
      rootPath = '',
      route,
      settings,
      loadedDevices,
    } = props.runtime
    const { apollo, history, deviceInfo, sessionPromise } = props
    const ignoreCanonicalReplacement = isJanusProxied || (query && query.map)
    this.fetcher = fetch

    if (binding && canUseDOM) {
      setCookie('vtex_binding_address', binding.canonicalBaseAddress)
    }

    if (history) {
      const renderLocation: RenderHistoryLocation = {
        ...history.location,
        search:
          exposeBindingAddress && binding
            ? appendLocationSearch(history.location.search, {
                __bindingAddress: binding.canonicalBaseAddress,
              })
            : history.location.search,
        pathname:
          ignoreCanonicalReplacement || !route.canonicalPath
            ? history.location.pathname
            : rootPath + route.canonicalPath,
        state: {
          navigationRoute: {
            id: route.id,
            params: route.params,
            path: history.location.pathname,
          },
          renderRouting: true,
        },
      }
      // TODO: use something with better performance than equals
      if (!equals(history.location as RenderHistoryLocation, renderLocation)) {
        history.replace(renderLocation)
      }
      // backwards compatibility
      window.browserHistory = global.browserHistory = history
    }

    // todo: reload window if client-side created a segment different from server-side
    this.sessionPromise = sessionPromise
    this.apolloClient = apollo.getClient(this)
    this.hydrateApollo = apollo.hydrate

    this.state = {
      appsEtag,
      blocks,
      blocksTree,
      cacheHints,
      contentMap,
      components,
      culture,
      defaultExtensions: {},
      device: 'any',
      loadedDevices: loadedDevices ?? [props.deviceInfo.type],
      deviceInfo,
      extensions,
      loadedPages: new Set([page]),
      messages,
      page,
      pages,
      preview: false,
      production,
      query,
      route,
      settings: settings || {},
      inspect: false,
    }

    this.prefetchRoutes = new Set<string>()
    this.navigationRouteModifiers = new Set()
    this.navigationModifierOptions = {}
  }

  public componentDidMount() {
    this.rendered = true
    const { history, runtime } = this.props
    const { production, emitter, publicEndpoint } = runtime

    this.unlisten = history?.listen(this.onPageChanged as LocationListener)
    emitter.addListener('localesChanged', this.onLocaleSelected)

    if (!production) {
      emitter.addListener('extensionsUpdated', this.updateRuntime)
      emitter.addListener('blocksUpdated', this.updateRuntime)
      emitter.addListener('styleOverrides', hotReloadOverrides)
      emitter.addListener('styleTachyonsUpdate', hotReloadTachyons)
    }

    this.sendInfoFromIframe()
    this.prefetchPages()

    if (
      publicEndpoint === 'myvtex.com' &&
      !production &&
      '__inspect' in (this.state.query || {})
    ) {
      this.setState({ inspect: true })
    }
  }

  public UNSAFE_componentWillReceiveProps(nextProps: Props) {
    const updatedProps = difference(
      Object.entries(nextProps),
      Object.entries(this.props)
    ).map(([propName]) => propName)

    /** Update all extensions if runtime has changed. */
    const hasUpdatedRuntime = updatedProps.includes('runtime')

    if (this.rendered && hasUpdatedRuntime) {
      const {
        runtime: { extensions },
      } = nextProps
      this.setState({ extensions })
    }
  }

  public componentWillUnmount() {
    const { runtime } = this.props
    const { production, emitter } = runtime
    if (this.unlisten) {
      this.unlisten()
    }
    emitter.removeListener('localesChanged', this.onLocaleSelected)

    if (!production) {
      emitter.removeListener('extensionsUpdated', this.updateRuntime)
      emitter.removeListener('blocksUpdated', this.updateRuntime)
      emitter.removeListener('styleOverrides', hotReloadOverrides)
      emitter.removeListener('styleTachyonsUpdate', hotReloadTachyons)
    }
  }

  public getChildContext(): RenderContext {
    const { history, runtime } = this.props
    const {
      components,
      contentMap,
      extensions,
      inspect,
      messages,
      page,
      pages,
      preview,
      culture,
      device,
      deviceInfo,
      route,
      query,
      defaultExtensions,
    } = this.state

    const {
      account,
      amp,
      binding,
      emitter,
      hints,
      platform,
      production,
      publicEndpoint,
      renderMajor,
      rootPath,
      workspace,
    } = runtime

    return {
      account,
      addMessages: this.addMessages,
      amp,
      binding,
      components,
      contentMap,
      culture,
      defaultExtensions,
      device,
      deviceInfo,
      emitter,
      ensureSession: this.ensureSession,
      extensions,
      fetchComponent: this.fetchComponent,
      fetchComponents: this.fetchComponents,
      getSettings: this.getSettings,
      goBack: this.goBack,
      hints,
      history,
      inspect,
      messages,
      navigate: this.navigate,
      onPageChanged: this.onPageChanged,
      page,
      pages,
      patchSession: this.patchSession,
      platform,
      prefetchDefaultPages: this.prefetchDefaultPages,
      addNavigationRouteModifier: this.addNavigationRouteModifier,
      navigationRouteModifiers: this.navigationRouteModifiers,
      prefetchPage: this.prefetchPage,
      preview,
      production,
      publicEndpoint,
      query,
      renderMajor,
      rootPath,
      route,
      setDevice: this.handleSetDevice,
      setQuery: this.setQuery,
      updateComponentAssets: this.updateComponentAssets,
      updateExtension: this.updateExtension,
      updateRuntime: this.updateRuntime,
      workspace,
    }
  }

  public getSettings = (app: string) => {
    const { settings } = this.state
    return settings[app]
  }

  public ensureSession = () => {
    return this.sessionPromise
  }

  public patchSession = (data?: any) => {
    return this.sessionPromise.then(() =>
      canUseDOM ? window.__RENDER_8_SESSION__.patchSession(data) : undefined
    )
  }

  public getCustomMessages = (locale: string) => {
    const { components } = this.state
    const componentsArray = Object.keys(components)

    const customMessages = componentsArray
      .map(getLoadedImplementation)
      .filter(
        (component) =>
          component &&
          (component.getCustomMessages || component.WrappedComponent)
      )
      .map((component) => {
        const getCustomMessages =
          component.getCustomMessages ||
          (component.WrappedComponent &&
            component.WrappedComponent.getCustomMessages) ||
          noop
        return getCustomMessages(locale)
      })
      .reduce((acc, strings) => ({ ...acc, ...strings }), {})

    return customMessages
  }

  public goBack = () => {
    const { history } = this.props
    return pageGoBack(history)
  }

  public setQuery = (
    query: Record<string, any> = {},
    {
      merge = true,
      replace = false,
      scrollOptions = false,
    }: SetQueryOptions = {}
  ): boolean => {
    const {
      history,
      runtime: { rootPath },
    } = this.props
    const {
      pages,
      page,
      route: { params },
    } = this.state
    if (!history) {
      return false
    }
    const {
      location: { search },
    } = history

    const current = queryStringToMap(search)
    const nextQuery = mapToQueryString(merge ? { ...current, ...query } : query)

    return pageNavigate(history, pages, {
      fetchPage: false,
      skipSetPath: true,
      page,
      params,
      query: nextQuery,
      replace,
      scrollOptions,
      rootPath,
      modifiers: this.navigationRouteModifiers,
    })
  }

  public navigate = (options: NavigateOptions) => {
    const {
      history,
      runtime: { rootPath },
    } = this.props
    const { pages } = this.state
    options.rootPath = rootPath
    options.modifiers = this.navigationRouteModifiers

    this.navigationModifierOptions = {
      ...this.navigationModifierOptions,
      ...options.modifiersOptions,
    }
    options.modifiersOptions = this.navigationModifierOptions

    if (this.navigationState.isNavigating) {
      const lastOptions = this.navigationState.lastOptions!
      if (!areOptionsDifferent(lastOptions, options)) {
        return false
      }
    }

    this.navigationState = {
      isNavigating: true,
      lastOptions: options,
    }

    return pageNavigate(history, pages, options)
  }

  private updateDeviceBlocks = async (deviceInfo: DeviceInfo) => {
    const {
      runtime: { isJanusProxied, rootPath },
    } = this.props

    const {
      route: { path },
    } = this.state

    const query = queryStringToMap(location.search) as RenderRuntime['query']

    const { components, extensions, messages } = await fetchServerPage({
      fetcher: this.fetcher,
      path: prependRootPath(path, rootPath),
      query,
      deviceInfo,
      isJanusProxied,
    })

    await this.fetchComponents(components, extensions)

    this.setState((state) => ({
      extensions: { ...state.extensions, ...extensions },
      components: { ...state.components, ...components },
      messages: { ...state.messages, ...messages },
    }))
  }

  public addNavigationRouteModifier = (modifier: NavigationRouteModifier) => {
    this.navigationRouteModifiers.add(modifier)
  }

  public replaceRouteClass = (route: string) => {
    try {
      const containers = document.getElementsByClassName(RENDER_CONTAINER_CLASS)
      const currentRouteClass = containers[0].className
        .split(' ')
        .find((c) => c.startsWith(ROUTE_CLASS_PREFIX))
      const newRouteClass = routeClass(route)

      Array.prototype.forEach.call(containers, (e: Element) => {
        if (currentRouteClass) {
          e.classList.remove(currentRouteClass)
        }
        e.classList.add(newRouteClass)
      })
    } catch (e) {
      console.error('Failed to set route class', routeClass(route))
    }
  }

  public scrollTo = (scrollOptions?: RenderScrollOptions) => {
    try {
      if (scrollOptions === false) {
        return
      }

      const options = scrollOptions || { top: 0, left: 0 }
      window.setTimeout(() => pageScrollTo(options), 0)
    } catch (e) {
      console.warn('Failed to scroll after page navigation.')
    }
  }

  private mergeRouteParams<T extends { params: any }>(
    matchingPage: T,
    transientRoute: { params: any }
  ): T {
    return {
      ...matchingPage,
      params: {
        ...transientRoute.params,
        ...matchingPage.params,
      },
    }
  }

  public afterPageChanged = (
    route: string,
    scrollOptions?: RenderScrollOptions
  ) => {
    this.navigationState = { isNavigating: false }
    this.replaceRouteClass(route)
    this.scrollTo(scrollOptions)
    this.sendInfoFromIframe()
  }

  public onPageChanged = (location: RenderHistoryLocation) => {
    const {
      runtime: { renderMajor, query: queryFromRuntime, isJanusProxied },
    } = this.props

    const {
      culture: { locale },
      pages: pagesState,
      production,
      route,
      loadedPages,
      deviceInfo,
    } = this.state
    const { state } = location

    // In case of other router's navigation, or when preventRemount is true, do nothing
    if (!state || !state.renderRouting || state.preventRemount) {
      return
    }

    const { navigationRoute, fetchPage } = state
    const { id: maybePage, params } = navigationRoute
    const transientRoute = { ...route, ...navigationRoute }

    // We always have to navigate to a page. If none was found, we
    // navigate to the current page with preview
    const allowConditions =
      pagesState[maybePage] && pagesState[maybePage].allowConditions
    const declarer = pagesState[maybePage] && pagesState[maybePage].declarer
    const shouldSkipFetchNavigationData =
      (!allowConditions && loadedPages.has(maybePage)) || fetchPage === false
    const query = queryStringToMap(location.search) as RenderRuntime['query']
    const page = maybePage || route.id

    if (shouldSkipFetchNavigationData) {
      return this.setState(
        {
          page,
          query,
          route: transientRoute,
        },
        () => this.afterPageChanged(page, state.scrollOptions)
      )
    }

    const paramsJSON = JSON.stringify(params)
    const apolloClient = this.apolloClient
    const routeId = page

    const {
      prefetchedPathData,
      routeData,
      destinationRouteId,
    } = getPrefetechedData(navigationRoute.path)

    if (prefetchedPathData && routeData && destinationRouteId) {
      const routeId = destinationRouteId
      const matchingPage = prefetchedPathData.matchingPage
      const contentResponse = prefetchedPathData.contentResponse
      let extensions = routeData.extensions
      let messages = routeData.messages
      if (contentResponse) {
        //create a fresh copy of extensions to not change the one in memory
        extensions = JSON.parse(JSON.stringify(routeData.extensions))
        messages = { ...messages, ...contentResponse.contentMessages }
        for (const {
          treePath,
          contentJSON,
          contentIds,
        } of contentResponse.extensionsContent || []) {
          if (contentJSON !== '{}') {
            extensions[treePath]!.content = contentJSON
              ? JSON.parse(contentJSON)
              : undefined
          }
          extensions[treePath]!.contentIds = contentIds
        }
      }

      this.hydrateApollo(prefetchedPathData.queryData).then(() => {
        this.setState(
          (state) => ({
            ...state,
            components: { ...state.components, ...routeData.components },
            extensions: { ...state.extensions, ...extensions },
            loadedPages: loadedPages.add(routeId),
            messages: { ...state.messages, ...messages },
            page: routeId,
            preview: false,
            query,
            route: this.mergeRouteParams(matchingPage, transientRoute),
          }),
          () => {
            this.navigationState = { isNavigating: false }
            this.replaceRouteClass(routeId)
            this.sendInfoFromIframe()
            this.scrollTo(state.scrollOptions)
          }
        )
      })

      return Promise.resolve()
    }

    // Sets the preloading state, which currently displays
    // a loading bar at the top of the page
    this.setState({
      preview: true,
    })

    // If workspace is set via querystring, keep it during navigation
    const workspaceFromQuery = queryFromRuntime?.workspace

    const navigationPromise = isEnabled('RENDER_NAVIGATION')
      ? fetchServerPage({
          fetcher: this.fetcher,
          path: navigationRoute.path,
          query,
          workspace: workspaceFromQuery,
          deviceInfo,
          isJanusProxied,
        }).then(
          async ({
            appsEtag,
            components,
            extensions,
            matchingPage,
            messages,
            pages,
            settings,
            queryData,
          }: ParsedServerPageResponse) => {
            if (
              isConflictingLoadedComponents(components, this.state.components)
            ) {
              this.scrollTo({ top: 0, left: 0 })
              window.location.reload()
              return new Promise(() => {})
            }

            await Promise.all([
              this.hydrateApollo(queryData),
              this.fetchComponents(components, extensions),
            ])

            this.setState(
              (state) => ({
                ...state,
                appsEtag,
                components: { ...state.components, ...components },
                extensions: { ...state.extensions, ...extensions },
                loadedDevices: [deviceInfo.type],
                loadedPages: loadedPages.add(matchingPage.routeId),
                messages: { ...state.messages, ...messages },
                page: matchingPage.routeId,
                pages,
                preview: false,
                query,
                route: this.mergeRouteParams(matchingPage, transientRoute),
                settings,
              }),
              () => {
                this.navigationState = { isNavigating: false }
                this.replaceRouteClass(matchingPage.routeId)
                this.sendInfoFromIframe()
                this.scrollTo(state.scrollOptions)
              }
            )
          }
        )
      : fetchNavigationPage({
          apolloClient,
          declarer,
          locale,
          paramsJSON,
          production,
          query: JSON.stringify(query),
          renderMajor,
          routeId,
          skipCache: false,
        }).then(
          async ({
            appsEtag,
            cacheHints,
            components,
            extensions,
            matchingPage,
            messages,
            pages,
            settings,
          }: ParsedPageQueryResponse) => {
            const updatedRoute = { ...transientRoute, ...matchingPage }
            await this.fetchComponents(components, extensions)

            this.setState(
              {
                appsEtag,
                cacheHints: mergeWith(merge, this.state.cacheHints, cacheHints),
                components: { ...this.state.components, ...components },
                extensions: { ...this.state.extensions, ...extensions },
                loadedPages: loadedPages.add(page),
                messages: { ...this.state.messages, ...messages },
                page,
                pages,
                preview: false,
                query,
                route: this.mergeRouteParams(updatedRoute, transientRoute),
                settings,
              },
              () => {
                this.navigationState = { isNavigating: false }
                this.replaceRouteClass(page)
                this.sendInfoFromIframe()
                this.scrollTo(state.scrollOptions)
              }
            )
          }
        )
    navigationPromise.finally(() => {
      if (this.navigationState.isNavigating) {
        this.navigationState = { isNavigating: false }
      }
    })
    return navigationPromise
  }

  public prefetchPage = (pageName: string) => {
    const { extensions } = this.state
    const component = extensions[pageName]?.component
    if (component) {
      const { runtime } = this.props
      const { components } = this.state
      const componentsAssetsMap = traverseComponent(components, component)
      return prefetchAssets(runtime, componentsAssetsMap)
    }
  }

  public prefetchDefaultPages = async (routeIds: string[]) => {
    const {
      runtime: { query },
    } = this.props

    const disablePrefetch =
      query &&
      DISABLE_PREFETCH_PAGES in query &&
      query[DISABLE_PREFETCH_PAGES] !== 'false'
    if (!disablePrefetch) {
      if (this.rendered) {
        console.warn(
          "prefetchDefaultPages should only be called before RenderProvider's render."
        )
        return
      }
      routeIds.forEach((routeId) => this.prefetchRoutes.add(routeId))
    }
  }

  public updateComponentAssets = (availableComponents: Components) => {
    this.setState({
      components: {
        ...this.state.components,
        ...availableComponents,
      },
    })
  }

  public fetchComponents = async (
    components: RenderRuntime['components'],
    extensions?: RenderRuntime['extensions']
  ) => {
    const { runtime } = this.props
    await fetchComponents(components, runtime, extensions)
    this.sendInfoFromIframe({ shouldUpdateRuntime: true })
  }

  public fetchComponent: RenderContext['fetchComponent'] = (component) => {
    if (!canUseDOM) {
      throw new Error('Cannot fetch components during server side rendering.')
    }

    const { runtime } = this.props
    const { components } = this.state

    const hasImplementation = !!hasComponentImplementation(component)

    if (hasImplementation) {
      return Promise.resolve()
    }

    const componentsAssetsMap = traverseComponent(components, component)

    const assetsPromise = fetchAssets(runtime, componentsAssetsMap)

    assetsPromise.then(() => {
      this.sendInfoFromIframe({ shouldUpdateRuntime: true })
    })

    return assetsPromise
  }

  public onLocaleSelected = (
    locale: string,
    domain?: string,
    callback?: (locale: string) => unknown
  ) => {
    if (locale !== this.state.culture.locale) {
      const sessionData = { public: {} }

      if (domain && domain === 'admin') {
        sessionData.public = {
          admin_cultureInfo: {
            value: locale,
          },
        }
      } else {
        sessionData.public = {
          cultureInfo: {
            value: locale,
          },
        }
      }

      return this.patchSession(sessionData)
        .then(() => {
          if (callback) return callback(locale)

          return window.location.reload()
        })
        .catch((e) => {
          console.log('Failed to fetch new locale file.')
          console.error(e)
        })
    }

    return undefined
  }

  public updateRuntime = async (options?: PageContextOptions) => {
    const {
      runtime: { renderMajor, query: queryFromRuntime, isJanusProxied },
    } = this.props
    const {
      page,
      pages: pagesState,
      production,
      culture: { locale },
      route,
      query,
      deviceInfo,
    } = this.state
    const declarer = pagesState[page] && pagesState[page].declarer
    const { pathname } = window.location
    const paramsJSON = JSON.stringify(route.params || {})

    // If workspace is set via querystring, keep it during navigation
    const workspaceFromQuery = queryFromRuntime?.workspace

    const {
      appsEtag,
      cacheHints,
      components,
      extensions,
      messages,
      pages,
      settings,
    } = isEnabled('RENDER_NAVIGATION')
      ? await fetchServerPage({
          path: route.path,
          query,
          fetcher: this.fetcher,
          workspace: workspaceFromQuery,
          deviceInfo,
          isJanusProxied,
        })
      : await fetchNavigationPage({
          apolloClient: this.apolloClient,
          declarer,
          locale,
          paramsJSON,
          path: pathname,
          production,
          query: '',
          renderMajor,
          routeId: page,
          skipCache: true,
          ...options,
        })

    await this.fetchComponents(components, extensions)

    await new Promise<void>((resolve) => {
      this.setState(
        (state) => ({
          appsEtag,
          cacheHints: isEnabled('RENDER_NAVIGATION')
            ? state.cacheHints
            : cacheHints,
          components,
          extensions: {
            ...state.extensions,
            ...extensions,
          },
          messages: {
            ...state.messages,
            ...messages,
          },
          page,
          pages,
          route,
          settings,
        }),
        resolve
      )
    })

    await this.sendInfoFromIframe()
  }

  public updateExtension = async (name: string, extension: Extension) => {
    const { extensions } = this.state

    await new Promise<void>((resolve) => {
      this.setState(
        {
          extensions: {
            ...extensions,
            [name]: extension,
          },
        },
        resolve
      )
    })

    if (name !== 'store/__overlay') {
      await this.sendInfoFromIframe()
    }
  }

  public handleSetDevice = (device: ConfigurationDevice) => {
    this.setState({ device })
  }

  public addMessages = async (newMessages: RenderRuntime['messages']) => {
    await new Promise<void>((resolve) => {
      this.setState(
        (state) => ({
          ...state,
          messages: {
            ...state.messages,
            ...newMessages,
          },
        }),
        resolve
      )
    })

    await this.sendInfoFromIframe()
  }

  private updateDevice = debounce(
    async (deviceInfo: DeviceInfo) => {
      if (!deviceInfo) {
        return
      }
      if (!this.state.loadedDevices.includes(deviceInfo.type)) {
        /** If resizing from a smaller to a larger device, keeps the current
         * blocks while the new ones are being loaded.
         * If resizing from a larger to a smaller one, can't do this because
         * the larger blocks would overflow the window and look bad.
         */
        const deviceOrder = ['desktop', 'tablet', 'phone']
        const prevDeviceType = this.state.deviceInfo.type
        const keepCurrentDevice =
          deviceOrder.indexOf(deviceInfo.type) <
          deviceOrder.indexOf(prevDeviceType)
        if (!keepCurrentDevice) {
          this.setState({ deviceInfo })
        }

        this.setState((state) => ({
          preview: true,
          loadedDevices: [...state.loadedDevices, deviceInfo.type],
        }))

        await this.updateDeviceBlocks(deviceInfo)
      }
      this.setState({
        deviceInfo,
        preview: false,
      })
    },
    200, // debounce timeout
    false // means "don't call this function immediately, wait for the debounce timeout"
  )

  public componentDidUpdate() {
    if (!equals(this.state.deviceInfo, this.props.deviceInfo)) {
      this.updateDevice(this.props.deviceInfo)
    }

    window?.performance?.mark?.(`RenderProvider-render-${this.renderTick}`)

    if (this.renderTick === 0) {
      const measures = [
        performanceMeasure('from-start-to-first-render', undefined, 'RenderProvider-render-0'),
        performanceMeasure('intl-polyfill', 'intl-polyfill-start', 'intl-polyfill-end'),
        performanceMeasure('uncritical-styles', 'uncritical-styles-start', 'uncritical-styles-end'),
        performanceMeasure('content-loaded', undefined, 'content-loaded-promise-resolved'),
        performanceMeasure('from-init-inline-js-to-first-render', 'init-inline-js', 'RenderProvider-render-0'),
        performanceMeasure('from-script-start-to-first-render', 'init-runScript', 'RenderProvider-render-0'),
        performanceMeasure('script-init', 'init-runScript', 'asyncScriptsReady-fired'),
        performanceMeasure('render-start-interval', 'asyncScriptsReady-fired', 'render-start'),
        performanceMeasure('first-render', 'render-start', 'RenderProvider-render-0'),
      ]

      logMeasures({
        measures,
        account: this.props.runtime.account,
        device: this.props.deviceInfo.type,
        page: this.props.runtime.page,
      })
    }

    this.renderTick++
  }

  private renderTick = 0

  public render() {
    const { children } = this.props
    const {
      culture: { locale },
      messages,
      pages,
      page,
      query,
      production,
      inspect,
    } = this.state
    const customMessages = this.getCustomMessages(locale)
    const mergedMessages = {
      ...messages,
      ...customMessages,
    }

    const component = children ? (
      React.cloneElement(children as ReactElement<any>, { query })
    ) : (
      <div className="render-provider">
        <Helmet title={pages[page] && pages[page].title} />
        <RenderPage page={page} query={query} />
      </div>
    )

    const context = this.getChildContext()

    return (
      <RenderContextProvider runtime={context}>
        <TreePathContextProvider treePath="">
          <ApolloProvider client={this.apolloClient}>
            <IntlProvider
              locale={locale}
              messages={mergedMessages}
              textComponent={Fragment}
            >
              <PrefetchContextProvider history={this.props.history}>
                <Fragment>
                  <ExtensionManager runtime={this.props.runtime} />
                  {!production && !isSiteEditorIframe && <BuildStatus />}
                  {component}
                  {isSiteEditorIframe ? (
                    <ExtensionPoint id="store/__overlay" />
                  ) : null}
                  {inspect && (
                    <Suspense fallback={null}>
                      <InspectorPopover />
                    </Suspense>
                  )}
                </Fragment>
              </PrefetchContextProvider>
            </IntlProvider>
          </ApolloProvider>
        </TreePathContextProvider>
      </RenderContextProvider>
    )
  }

  // Deprecated
  private updateMessages = (newMessages: RenderProviderState['messages']) => {
    this.setState(
      (prevState) => ({
        ...prevState,
        messages: { ...prevState.messages, ...newMessages },
      }),
      () => {
        this.sendInfoFromIframe()
      }
    )
  }

  private prefetchPages = () => {
    if (this.prefetchRoutes.size > 0) {
      setTimeout(this.execPrefetchPages, 6 * 1000)
    }
  }

  private execPrefetchPages = async () => {
    const {
      runtime,
      runtime: { renderMajor },
    } = this.props

    const {
      pages,
      culture: { locale },
    } = this.state

    const { components: defaultComponents } = await fetchDefaultPages({
      apolloClient: this.apolloClient,
      locale,
      pages,
      renderMajor,
      routeIds: Array.from(this.prefetchRoutes),
    })

    const allAssets = traverseListOfComponents(
      defaultComponents,
      Object.keys(defaultComponents)
    )

    await prefetchAssets(runtime, allAssets)
  }
}

export default withDevice<Props>(RenderProvider)
