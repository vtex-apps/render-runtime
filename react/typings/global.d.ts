import { ApolloClient } from 'apollo-client'
import { NormalizedCacheObject } from 'apollo-cache-inmemory'
import { EventEmitter } from 'eventemitter3'
import { Component } from 'react'
import ExtensionContainer from '../ExtensionContainer'
import ExtensionPoint from '../ExtensionPoint'
import Link from '../components/Link'
import { History, Location } from 'history'
import { HelmetData } from 'react-helmet'
import { TreePathProps } from '../utils/treePath'
import { LayoutContainer } from '../core/main'
import { IntrospectionResultData } from 'apollo-cache-inmemory'
import { NavigationRouteModifier } from '../utils/pages'

declare global {
  interface RenderMetric {
    getDataFromTree?: [number, number]
    renderToString: [number, number]
  }

  interface ServerRendered {
    markup: string
    renderTimeMetric: RenderMetric
  }

  interface NamedMarkup {
    markup: string
    name: string
  }

  interface NamedServerRendered {
    markups: NamedMarkup[]
    maxAge: number
    page: string
    renderTimeMetric: RenderMetric
    ampScripts?: string[]
  }

  type ClientRendered = Element

  interface Preview {
    type: string
    width: PreviewDimension
    height: PreviewDimension
    fullWidth?: boolean
    options?: any
  }

  interface PreviewDimension {
    desktop: PreviewDimensionValue
    mobile: PreviewDimensionValue
  }

  interface PreviewDimensionValue {
    fromProp?: string
    defaultValue?: number
  }

  enum Composition {
    blocks = 'blocks',
    children = 'children',
  }

  interface BlockInsertion {
    extensionPointId: string
    blockId: string
    children?: boolean
    slot?: boolean
  }

  interface Extension {
    after?: string[]
    around?: string[]
    before?: string[]
    blockId?: string
    blocks?: BlockInsertion[]
    context?: {
      component: string
      props?: any
    }
    component: string
    track?: string[]
    props?: any
    content?: Record<string, any>
    render?: RenderStrategy
    preview?: Preview
    hydration?: Hydration
    composition?: Composition
    hasContentSchema?: boolean
    contentIds?: string[]
  }

  interface Extensions {
    [name: string]: Extension?
  }

  interface LogEvent {
    name: string
    data?: any
  }

  interface Culture {
    availableLocales: string[]
    locale: string
    language: string
    country: string
    currency: string
  }

  interface Page {
    allowConditions: boolean
    canonical?: string
    cname?: string
    path: string
    auth?: boolean
    params?: any
    theme?: string
    disableExternals?: string[]
    declarer?: string
    name?: string
    title?: string
    conditional?: boolean
    map?: string[]
    routeId: string
    blockId: string
  }

  interface NavigationRoute {
    path: string
    params: Record<string, any>
    id: string
  }

  interface SetQueryOptions {
    merge?: boolean
    replace?: boolean
    scrollOptions?: RenderScrollOptions
  }

  interface Route {
    domain: string
    blockId: string
    canonicalPath?: string
    id: string
    metaTags?: RouteMetaTags
    pageContext: PageDataContext
    params: Record<string, any>
    path: string
    title?: string
  }

  interface RelativeScrollToOptions extends ScrollToOptions {
    baseElementId?: string
  }

  type RenderScrollOptions = RelativeScrollToOptions | false

  interface RenderHistoryLocation extends Location {
    state?: {
      navigationRoute: NavigationRoute
      renderRouting?: true
      scrollOptions?: RenderScrollOptions
      fetchPage?: boolean
      preventRemount?: boolean
    }
  }

  interface Pages {
    [name: string]: Page
  }

  interface RenderedSuccess {
    state: any
    head: HelmetData
    maxAge: number
    extensions: {
      [id: string]: string
    }
    renderMetrics: {
      [name: string]: RenderMetric
    }
  }

  interface RenderedFailure {
    error: any
  }

  type ConfigurationDevice = 'any' | 'desktop' | 'mobile'

  interface RenderHints {
    desktop: boolean
    mobile: boolean
    tablet: boolean
    phone: boolean
  }

  interface RenderContext {
    amp: RenderRuntime['amp']
    account: RenderRuntime['account']
    addMessages: (newMessages: RenderContext['messages']) => Promise<void>
    amp: boolean
    addNavigationRouteModifier: (modifier: NavigationRouteModifier) => void
    binding: RenderRuntime['binding']
    components: RenderRuntime['components']
    contentMap: RenderRuntime['contentMap']
    culture: RenderRuntime['culture']
    defaultExtensions: RenderRuntime['defaultExtensions']
    device: ConfigurationDevice
    emitter: RenderRuntime['emitter']
    ensureSession: () => Promise<void>
    extensions: RenderRuntime['extensions']
    fetchComponent: (component: string) => Promise
    fetchComponents: (
      components: RenderRuntime['components'],
      extensions?: RenderRuntime['extensions']
    ) => Promise<void>
    getSettings: (app: string) => any
    goBack: () => void
    hints: RenderHints
    history: History | null
    inspect: RenderRuntime['inspect']
    messages: RenderRuntime['messages']
    navigate: (options: NavigateOptions) => boolean
    onPageChanged: (location: RenderHistoryLocation) => void
    page: RenderRuntime['page']
    pages: RenderRuntime['pages']
    patchSession: (data?: any) => Promise<void>
    platform: string
    prefetchDefaultPages: (routeIds: string[]) => Promise<void>
    prefetchPage: (name: string) => void
    preview: RenderRuntime['preview']
    production: RenderRuntime['production']
    publicEndpoint: RenderRuntime['publicEndpoint']
    query: RenderRuntime['query']
    renderMajor: number
    rootPath?: string
    route: RenderRuntime['route']
    setDevice: (device: ConfigurationDevice) => void
    setQuery: (
      query?: Record<string, any>,
      options?: SetQueryOptions
    ) => boolean
    updateComponentAssets: (availableComponents: Components) => void
    updateExtension: (name: string, extension: Extension) => Promise<void>
    updateRuntime: (options?: PageContextOptions) => Promise<void>
    workspace: RenderRuntime['workspace']
  }

  interface PageContextOptions {
    scope?: string
    device?: string
    conditions?: string[]
    template?: string
  }

  interface FetchRoutesInput extends PageContextOptions {
    apolloClient: ApolloClient<NormalizedCacheObject>
    locale: string
    page: string
    paramsJSON?: string
    path?: string
    production: boolean
    renderMajor: number
  }

  interface FetchDefaultPages {
    apolloClient: ApolloClient<NormalizedCacheObject>
    locale: string
    pages: Pages
    routeIds: string[]
    renderMajor: number
  }

  interface FetchNavigationDataInput {
    apolloClient: ApolloClient<NormalizedCacheObject>
    production: boolean
    locale: string
    routeId: string
    declarer?: string
    paramsJSON?: string
    path?: string
    renderMajor: number
    skipCache: boolean
    query: string
  }

  interface RenderComponent<P = {}, S = {}> {
    getCustomMessages?: (locale: string) => any
    WrappedComponent?: RenderComponent
    new (): Component<P, S>
  }

  interface ComponentsRegistry {
    [component: string]: RenderComponent<any, any>
  }

  interface HotEmitterRegistry {
    [appId: string]: EventEmitter
  }

  interface GraphQLResult<T extends string, U> {
    data: Record<T, U>
    errors?: any
  }

  interface DefaultPagesQueryResult {
    data: DefaultPagesQueryResultData
    errors?: any
  }

  interface DefaultPagesQueryResultData {
    defaultPages: DefaultPagesQueryResponse
  }

  interface PageDataContext {
    type: string
    id: string
  }

  interface RouteMetaTags {
    description?: string
    keywords?: string[]
  }

  interface MatchingPage {
    blockId: string
    canonicalPath?: string
    metaTags?: RouteMetaTags
    pageContext: PageDataContext
    title?: string
    routeId: string
  }

  interface MatchingServerPage {
    blockId: string
    canonicalPath?: string
    metaTags?: RouteMetaTags
    pageContext: PageDataContext
    title?: string
    routeId: string
    params: Record<string, string>
    id: string
    path: string
    domain: string
  }

  interface ServerPageResponse {
    appsEtag: RenderRuntime['appsEtag']
    blocks: RenderRuntime['blocks']
    blocksTree: RenderRuntime['blocksTree']
    cacheHints: RenderRuntime['cacheHints']
    contentMap: RenderRuntime['contentMap']
    components: RenderRuntime['components']
    extensions: RenderRuntime['extensions']
    messages: RenderRuntime['messages']
    pages: RenderRuntime['pages']
    route: MatchingServerPage
    settings: RenderRuntime['settings']
    queryData: RenderRuntime['queryData']
  }

  interface PageQueryResponse {
    blocksJSON: string
    blocksTreeJSON: string
    contentMapJSON: string
    componentsJSON: string
    extensionsJSON: string
    messages: KeyedString[]
    pagesJSON: string
    appsSettingsJSON: string
    appsEtag: string
    cacheHintsJSON: string
    page: MatchingPage
  }

  interface DefaultPagesQueryResponse {
    componentsJSON: string
    extensionsJSON: string
    messages: KeyedString[]
  }

  interface KeyedString {
    key: string
    message: string
  }

  interface ParsedServerPageResponse extends ServerPageResponse {
    matchingPage: MatchingServerPage
  }

  interface ParsedPageQueryResponse {
    blocks: RenderRuntime['blocks']
    blocksTree: RenderRuntime['blocksTree']
    contentMap: RenderRuntime['contentMap']
    components: RenderRuntime['components']
    extensions: RenderRuntime['extensions']
    messages: RenderRuntime['messages']
    pages: RenderRuntime['pages']
    appsEtag: RenderRuntime['appsEtag']
    settings: RenderRuntime['settings']
    cacheHints: RenderRuntime['cacheHints']
    matchingPage: MatchingPage
  }

  interface ParsedDefaultPagesQueryResponse {
    components: RenderRuntime['components']
  }

  type Rendered = Promise<ClientRendered | NamedServerRendered>

  interface AssetEntry {
    name: string
    path: string
    app: string
  }

  interface ComponentEntry {
    assets: string[]
    dependencies: string[]
  }

  interface Components {
    [entrypoint: string]: ComponentEntry
  }

  interface BindingInfo {
    id: string
    canonicalBaseAddress: string
  }

  interface RenderRuntime {
    amp: boolean
    account: string
    accountId: string
    appsEtag: string
    binding?: BindingInfo
    blocks?: Blocks
    blocksTree?: BlockContentTree
    contentMap?: ContentMap
    customRouting?: boolean
    emitter: EventEmitter
    exposeBindingAddress?: boolean
    workspace: string
    disableSSR: boolean
    disableSSQ: boolean
    hints: any
    introspectionResult: IntrospectionResultData
    inspect: boolean
    page: string
    route: Route
    version: string
    culture: Culture
    pages: Pages
    extensions: Extensions
    platform: string
    preview: boolean
    production: boolean
    publicEndpoint: string
    messages: Locale
    components: Components
    renderMajor: number
    query?: Record<string, string>
    serverQuery?: Record<string, string>
    start: boolean
    runtimeMeta: {
      version: string
      config?: any
    }
    settings: {
      [app: string]: any
    }
    cacheHints: CacheHintsMap
    segmentToken: string
    defaultExtensions: Extensions
    rootPath?: string
    workspaceCookie: string
    hasNewExtensions: boolean
    queryData?: Array<{
      query: string
      variables: any
      data: string
    }>
  }

  interface CacheHints {
    scope?: string
    maxAge?: string
    version?: number
    provider?: string
    sender?: string
  }

  interface CacheHintsMap {
    [hash: string]: CacheHints
  }

  interface RuntimeExports {
    ExtensionContainer: ExtensionContainer
    ExtensionPoint: ExtensionPoint
    Link: Link
    NoSSR: any
    LayoutContainer: any
    LegacyExtensionContainer: any
    Loading: any
    Helmet: any
    canUseDOM: boolean
    withHMR: any
    withRuntimeContext: any
    withSession: any
    RenderContextConsumer: React.Consumer<RenderContext>
    TreePathContextConsumer: React.Consumer<TreePathProps>
    buildCacheLocator: any
    useRuntime(): RenderContext
    start(): void
    render(
      name: string,
      runtime: RenderRuntime,
      element?: HTMLElement
    ): Rendered
  }

  interface RenderSession {
    patchSession: (data: any) => Promise<void>
    sessionPromise: Promise<void>
  }

  interface Window extends Window {
    __APP_ID__: string
    __ERROR__: any
    __hasPortals__: boolean
    __hostname__: string
    __pathname__: string
    __provideRuntime: (
      runtime: RenderContext | null,
      messages: Record<string, string>,
      shouldUpdateRuntime: boolean,
      setMessages: (messages: RenderRuntime['messages']) => void
    ) => Promise<void>
    __RENDER_8_COMPONENTS__: ComponentsRegistry
    __RENDER_8_HOT__: HotEmitterRegistry
    __RENDER_8_RUNTIME__: RuntimeExports
    __RENDER_8_SESSION__: RenderSession
    __REQUEST_ID__: string
    __RUNTIME__: RenderRuntime
    __STATE__: NormalizedCacheObject
    __UNCRITICAL_PROMISE__: Promise<void> | undefined
    browserHistory: History
    flags: Record<string, boolean>
    hrtime: NodeJS.Process['hrtime']
    Intl: any
    IntlPolyfill: any
    myvtexSSE: any
    ReactAMPHTML: any
    ReactAMPHTMLHelpers: any
    ReactIntlLocaleData: any
    ReactIntl: any
    IntlPluralRules: any
    IntlRelativeTimeFormat: any
    rendered: Promise<RenderedSuccess> | RenderedFailure
    requestIdleCallback: (callback: (...args) => any | void) => number
    ReactApollo: any
  }

  interface BlockEntry {
    after?: BlockInsertion[]
    around?: BlockInsertion[]
    before?: BlockInsertion[]
    blockId: string
    blocks?: BlockInsertion[]
    component: string
    composition?: Composition
    hasContentSchema: boolean
    props?: Record<string, any>
    context?: {
      component: string
      props?: Record<string, any>
    }
    implements: string[]
    originalBlockId?: string
    preview?: Preview
    render: RenderStrategy
    hydration?: Hydration
    track?: string[]
    title?: string
  }

  interface TreeEntry {
    blockIdMap: Record<string, BlockId>
    contentIdMap: Record<string, string>
  }

  interface ContentMap {
    [contentId: string]: Record<string, any>
  }

  type RenderStrategy = 'client' | 'lazy' | 'server'
  type Hydration = 'always' | 'on-view'
  type BlockContentTree = Record<string, TreeEntry>
  type Blocks = Record<string, BlockEntry>

  namespace NodeJS {
    interface Global extends Window {
      myvtexSSE: any
    }
  }

  interface NodeModule {
    hot: any
  }
}
