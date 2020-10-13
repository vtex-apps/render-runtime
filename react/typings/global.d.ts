import { ApolloClient } from 'apollo-client'
import { NormalizedCacheObject } from 'apollo-cache-inmemory'
import { EventEmitter } from 'eventemitter3'
import { Component } from 'react'
import ExtensionContainer from '../ExtensionContainer'
import ExtensionPoint from '../components/ExtensionPoint/index'
import Link from '../components/Link'
import { History, Location } from 'history'
import { HelmetData } from 'react-helmet'
import { TreePathProps } from '../utils/treePath'

import type { RenderContext } from '../components/RenderContext'

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

interface LogEvent {
  name: string
  data?: any
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

interface PageContextOptions {
  scope?: string
  device?: string
  conditions?: string[]
  template?: string
}

export type ApolloClientType = ApolloClient<NormalizedCacheObject>

interface FetchRoutesInput extends PageContextOptions {
  apolloClient: ApolloClientType
  locale: string
  page: string
  paramsJSON?: string
  path?: string
  production: boolean
  renderMajor: number
}

interface FetchDefaultPages {
  apolloClient: ApolloClientType
  locale: string
  pages: Pages
  routeIds: string[]
  renderMajor: number
}

interface FetchNavigationDataInput {
  apolloClient: ApolloClientType
  production: boolean
  locale: string
  routeId: string
  declarer?: string | null
  paramsJSON?: string
  path?: string
  renderMajor: number
  skipCache: boolean
  query?: string
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

interface MatchingPage {
  blockId: string
  canonicalPath?: string
  metaTags?: RouteMetaTags
  pageContext: PageDataContext
  title?: string
  routeId: string
}

type Rendered = Promise<void | ClientRendered | NamedServerRendered>

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
  page: string
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
  render(name: string, runtime: RenderRuntime, element?: HTMLElement): Rendered
}

interface RenderSession {
  patchSession: (data: any) => Promise<void>
  sessionPromise: Promise<void>
}

declare global {
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
    __RUNTIME_EXTENSIONS__: RenderRuntime['extensions']
    __RUNTIME_QUERYDATA__: RenderRuntime['queryData']
    __STATE__: NormalizedCacheObject
    __DOM_READY__?: boolean
    __ASYNC_SCRIPTS_READY__?: boolean
    __CRITICAL__UNCRITICAL_APPLIED__: Promise<void> | undefined
    __CRITICAL__RAISE_UNCRITICAL_EVENT__: () => void | null
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

  namespace NodeJS {
    interface Global extends Window {
      myvtexSSE: any
    }
  }

  interface NodeModule {
    hot: any
  }
}

interface PrefetchRouteData {
  extensions: RenderRuntime['extensions']
  components: RenderRuntime['components']
  messages: RenderRuntime['messages']
}

interface ContentResponse {
  contentMapJSON: string
  extensionsContent: {
    contentJSON: string
    contentIds: string[]
    treePath: string
  }[]
  contentMessages: RenderRuntime['messages']
}
