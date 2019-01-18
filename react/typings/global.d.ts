import {ApolloClient, Subscription} from 'apollo-client'
import {NormalizedCacheObject} from "apollo-cache-inmemory"
import * as EventEmitter from 'eventemitter3'
import {ReactElement, Component} from "react"
import ExtensionContainer from "../ExtensionContainer"
import ExtensionPoint from "../ExtensionPoint"
import Link from "../components/Link"
import {History, Location} from "history"
import {HelmetData} from "react-helmet"
import {TreePathProps} from "../utils/treePath"
import { LayoutContainer } from '../core/main'

declare global {
  interface RenderMetric {
    getDataFromTree: [number, number],
    renderToString: [number, number],
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
  }

  type ClientRendered = Element

  interface Extension {
    context?: {
      component: string
      props?: any
    }
    wrappers?: string[]
    component: string
    props?: any
    shouldRender?: boolean
  }

  interface Extensions {
    [name: string]: Extension
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
  }

  interface Route {
    canonical?: string
    path?: string
    params?: Record<string, string>
    id: string
  }

  interface RelativeScrollToOptions extends ScrollToOptions {
    baseElementId?: string
  }

  type RenderScrollOptions = RelativeScrollToOptions | false

  interface RenderHistoryLocation extends Location {
    state?: {
      route: Route
      renderRouting?: true
      scrollOptions?: RenderScrollOptions
    }
  }

  interface Pages {
    [name: string]: Page
  }

  interface RenderedSuccess {
    state: any,
    head: HelmetData,
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
  }

  interface RenderContext {
    account: RenderRuntime['account'],
    components: RenderRuntime['components'],
    culture: RenderRuntime['culture'],
    device: ConfigurationDevice,
    emitter: RenderRuntime['emitter'],
    ensureSession: () => Promise<void>,
    extensions: RenderRuntime['extensions'],
    fetchComponent: (component: string) => Promise<void>,
    getSettings: (app: string) => any,
    hints: RenderHints,
    history: History | null,
    navigate: (options: NavigateOptions) => boolean,
    onPageChanged: (location: RenderHistoryLocation) => void,
    page: RenderRuntime['page'],
    pages: RenderRuntime['pages'],
    patchSession: (data?: any) => Promise<void>,
    prefetchPage: (name: string) => void,
    preview: RenderRuntime['preview'],
    production: RenderRuntime['production'],
    publicEndpoint: RenderRuntime['publicEndpoint'],
    setDevice: (device: ConfigurationDevice) => void,
    updateComponentAssets: (availableComponents: Components) => void,
    updateExtension: (name: string, extension: Extension) => void,
    updateRuntime: (options?: PageContextOptions) => Subscription,
    workspace: RenderRuntime['workspace'],
    route: RenderRuntime['route']
    defaultExtensions: RenderRuntime['defaultExtensions']
  }

  interface PageContextOptions {
    scope?: string
    device?: string
    conditions?: string[]
    template?: string
  }

  interface FetchRoutesInput extends PageContextOptions {
    apolloClient: ApolloClient<NormalizedCacheObject>,
    locale: string,
    page: string,
    paramsJSON?: string,
    path?: string,
    production: boolean,
    renderMajor: number,
  }

  interface FetchDefaultPages {
    apolloClient: ApolloClient<NormalizedCacheObject>,
    locale: string,
    pages: Pages,
    routeIds: string[],
    renderMajor: number,
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
  }

interface RenderComponent<P={}, S={}> {
  new(): Component<P,S>
  getCustomMessages?: (locale: string) => any
  WrappedComponent?: RenderComponent
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
    data: DefaultPagesQueryResultData,
    errors?: any,
  }

  interface DefaultPagesQueryResultData {
    defaultPages: DefaultPagesQueryResponse,
  }

  interface PageQueryResponse {
    componentsJSON: string
    extensionsJSON: string
    messagesJSON: string
    pagesJSON: string
    appsSettingsJSON: string
    appsEtag: string
    cacheHintsJSON: string
  }

  interface DefaultPagesQueryResponse {
    componentsJSON: string
    extensionsJSON: string
    messagesJSON: string
  }

  interface ParsedPageQueryResponse {
    components: RenderRuntime['components']
    extensions: RenderRuntime['extensions']
    messages: RenderRuntime['messages']
    pages: RenderRuntime['pages']
    appsEtag: RenderRuntime['appsEtag']
    settings: RenderRuntime['settings']
    cacheHints: RenderRuntime['cacheHints']
  }

  interface ParsedDefaultPagesQueryResponse {
    components: RenderRuntime['components']
    extensions: RenderRuntime['extensions']
    messages: RenderRuntime['messages']
  }

  type Rendered = ClientRendered | Promise<NamedServerRendered>

  interface ComponentTraversalResult {
    apps: string[]
    assets: string[]
  }

  interface ComponentEntry {
    assets: string[]
    dependencies: string[]
  }

  interface Components {
    [entrypoint: string]: ComponentEntry
  }

  interface RenderRuntime {
    account: string
    accountId: string
    appsEtag: string
    customRouting?: boolean
    emitter: EventEmitter
    workspace: string
    disableSSR: boolean
    hints: any
    page: string
    route: Route
    version: string
    culture: Culture
    pages: Pages
    extensions: Extensions
    preview: boolean
    production: boolean
    publicEndpoint: string
    messages: Record<string, string>
    components: Components
    renderMajor: number
    query?: Record<string, string>
    start: boolean
    runtimeMeta: {
      version: string
      config?: any
    }
    settings: {
      [app: string]: any;
    }
    cacheHints: CacheHintsMap
    segmentToken: string
    defaultExtensions: Extensions
  }

  interface CacheHints {
    scope?: string
    maxAge?: string
    version?: number
  }

  interface CacheHintsMap {
    [hash: string]: CacheHints
  }

  interface RuntimeExports {
    start(): void
    render(name: string, runtime: RenderRuntime, element?: HTMLElement): Rendered
    ExtensionContainer: typeof ExtensionContainer
    ExtensionPoint: typeof ExtensionPoint
    Link: typeof Link
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
  }

  interface RenderSession {
    patchSession: (data: any) => Promise<void>
    sessionPromise: Promise<void>
  }

  interface Window extends Window {
    __APOLLO_SSR__: boolean
    __ERROR__: any
    __RENDER_8_SESSION__: RenderSession
    __RENDER_8_RUNTIME__: RuntimeExports
    __RENDER_8_COMPONENTS__: ComponentsRegistry
    __RENDER_8_HOT__: HotEmitterRegistry
    __RUNTIME__: RenderRuntime
    __hostname__: string
    __pathname__: string
    __STATE__: NormalizedCacheObject
    __REQUEST_ID__: string
    __APP_ID__: string
    __hasPortals__: boolean
    __provideRuntime: (runtime: RenderContext | null, messages?: Record<string, string>, shouldUpdateRuntime?: boolean) => void
    browserHistory: History
    ReactIntlLocaleData: any
    IntlPolyfill: any
    Intl: any
    hrtime: NodeJS.Process['hrtime']
    myvtexSSE: any
    rendered: Promise<RenderedSuccess> | RenderedFailure
  }
}
