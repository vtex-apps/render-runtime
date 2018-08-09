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

  type RenderScrollOptions = ScrollToOptions | false

  interface RenderHistoryLocation extends Location {
    state?: {
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

  interface RenderContext {
    account: RenderRuntime['account'],
    components: RenderRuntime['components'],
    culture: RenderRuntime['culture'],
    device: ConfigurationDevice,
    emitter: RenderRuntime['emitter'],
    extensions: RenderRuntime['extensions'],
    fetchComponent: (component: string) => Promise<void>,
    getSettings: (app: string) => any,
    history: History | null,
    navigate: (options: NavigateOptions) => boolean,
    onPageChanged: (location: RenderHistoryLocation) => void,
    page: RenderRuntime['page'],
    pages: RenderRuntime['pages'],
    prefetchPage: (name: string) => Promise<void>,
    production: RenderRuntime['production'],
    setDevice: (device: ConfigurationDevice) => void,
    updateComponentAssets: (availableComponents: Components) => void,
    updateExtension: (name: string, extension: Extension) => void,
    updateRuntime: (options?: PageContextOptions) => Subscription,
    workspace: RenderRuntime['workspace'],
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
    params?: string,
    path?: string,
    production: boolean,
    renderMajor: number,
  }

interface RenderComponent<P={}, S={}> {
  new(): Component<P,S>
  getCustomMessages?: (locale: string) => any
}

  interface ComponentsRegistry {
    [component: string]: RenderComponent<any, any>
  }

  interface HotEmitterRegistry {
    [appId: string]: EventEmitter
  }

  interface PageQueryResult {
    data: PageQueryResultData,
    errors?: any,
  }

  interface PageQueryResultData {
    page: PageQueryResponse,
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

  interface ParsedPageQueryResponse {
    components: RenderRuntime['components']
    extensions: RenderRuntime['extensions']
    messages: RenderRuntime['messages']
    pages: RenderRuntime['pages']
    appsEtag: RenderRuntime['appsEtag']
    settings: RenderRuntime['settings']
    cacheHints: RenderRuntime['cacheHints']
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
    version: string
    culture: Culture
    pages: Pages
    extensions: Extensions
    production: boolean
    publicEndpoint: string
    messages: Record<string, string>
    iframeMessages?: Record<string, string>
    components: Components
    renderMajor: number
    query?: Record<string, string>
    start: boolean
    settings: {
      [app: string]: any;
    }
    cacheHints: CacheHints
  }

  interface CacheHints {
    [hash: string]: {
      scope: string
      maxAge: string
      version: number
    }
  }

  interface RuntimeExports {
    start(): void
    render(name: string, runtime: RenderRuntime, element?: HTMLElement): Rendered
    ExtensionContainer: typeof ExtensionContainer
    ExtensionPoint: typeof ExtensionPoint
    Link: typeof Link
    NoSSR: any
    LayoutContainer: any
    Loading: any
    Helmet: any
    canUseDOM: boolean
    withHMR: any
    withRuntimeContext: any
    RenderContextConsumer: React.Consumer<RenderContext>
    TreePathContextConsumer: React.Consumer<TreePathProps>
    buildCacheLocator: any
  }

  interface Window extends Window {
    __APOLLO_SSR__: boolean
    __RENDER_7_RUNTIME__: RuntimeExports
    __RENDER_7_COMPONENTS__: ComponentsRegistry
    __RENDER_7_HOT__: HotEmitterRegistry
    __RUNTIME__: RenderRuntime
    __hostname__: string
    __pathname__: string
    __STATE__: NormalizedCacheObject
    __hasPortals__: boolean
    browserHistory: History
    ReactIntlLocaleData: any
    IntlPolyfill: any
    Intl: any
    hrtime: NodeJS.Process['hrtime']
    rendered: Promise<RenderedSuccess> | RenderedFailure
  }
}
