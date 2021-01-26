import { IntrospectionResultData } from 'apollo-cache-inmemory'
import EventEmitter from 'eventemitter3'
import { Device, DeviceInfo } from '../utils/withDevice'

export interface RenderRuntime {
  amp: boolean
  account: string
  accountId: string
  appsEtag: string
  binding?: BindingInfo
  blocks?: Blocks
  blocksTree?: BlockContentTree
  channelPrivacy?: 'private' | 'public'
  contentMap?: ContentMap
  customRouting?: boolean
  emitter: EventEmitter
  exposeBindingAddress?: boolean
  workspace: string
  disableSSR: boolean
  disableSSQ: boolean
  hints: RenderHints
  introspectionResult: IntrospectionResultData
  inspect: boolean
  page: string
  route: Route
  version: string
  culture: Culture
  pages: Pages
  extensions: Extensions
  platform: string
  concurrentMode: boolean
  loadedDevices: Device[]
  deviceInfo: DeviceInfo
  preview: boolean
  production: boolean
  publicEndpoint: string
  messages: Record<string, string>
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
  uncriticalStyleRefs?: StyleRefs
  isJanusProxied?: boolean
}

export interface Route {
  domain: string
  blockId: string
  canonicalPath?: string
  id: string
  metaTags?: RouteMetaTags
  pageContext: PageDataContext
  params: Record<string, any>
  queryString?: Record<string, any>
  path: string
  title?: string
}

interface RouteMetaTags {
  description?: string
  keywords?: string[]
}

interface PageDataContext {
  type: string
  id: string
}

interface ContentMap {
  [contentId: string]: Record<string, any>
}

interface RenderHints {
  desktop: boolean
  mobile: boolean
  tablet: boolean
  phone: boolean
  unknown: boolean
}

interface Culture {
  country: string
  availableLocales: string[]
  currency: string
  customCurrencyDecimalDigits: number | null
  customCurrencySymbol: string | null
  language: string
  locale: string
}

export interface Pages {
  [name: string]: Page
}

export interface Page {
  allowConditions: boolean
  canonical?: string
  cname?: string
  path: string
  auth?: boolean
  params?: any
  theme?: string
  disableExternals?: string[]
  declarer?: string | null
  name?: string
  title?: string
  conditional?: boolean
  map?: string[]
  routeId: string
  blockId: string
}

export interface BindingInfo {
  id: string
  canonicalBaseAddress: string
}

type BlockContentTree = Record<string, TreeEntry>
type Blocks = Record<string, BlockEntry>

type RenderStrategy = 'client' | 'lazy' | 'server'
type HydrationType = 'always' | 'on-view'

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
  hydration?: HydrationType
  track?: string[]
  title?: string
}

interface TreeEntry {
  blockIdMap: Record<string, string>
  contentIdMap: Record<string, string>
}

export interface BlockInsertion {
  extensionPointId: string
  blockId: string
  /**
   * This property was replaced by blockRole,
   * but it cannot be removed since that would be a breaking-change
   * in builder-hub. Prefer using blockRole since it can tell you more
   * about the BlockInsertion.
   */
  children?: boolean
  blockRole?: 'block' | 'children' | 'slot'
}

export interface Extension {
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
  hydration?: HydrationType
  composition?: Composition
  hasContentSchema?: boolean
  contentIds?: string[]
}

export interface Extensions {
  [name: string]: Extension
}

enum Composition {
  blocks = 'blocks',
  children = 'children',
}

interface Preview {
  type: string
  width: PreviewDimension
  height: PreviewDimension
  fullWidth?: boolean
  options?: any
}

export interface PreviewDimension {
  desktop: PreviewDimensionValue
  mobile: PreviewDimensionValue
}

interface PreviewDimensionValue {
  fromProp?: string
  defaultValue?: number
}

interface StyleRefs {
  base: StyleRef[]
  overrides: StyleRef[]
}

export interface StyleRef {
  path: string
  id?: string
  class?: string
  crossorigin?: boolean
  preload?: boolean
  media?: string
}

export interface CacheHints {
  scope?: string
  maxAge?: string
  version?: number
  provider?: string
  sender?: string
}

interface CacheHintsMap {
  [hash: string]: CacheHints
}

export interface Components {
  [entrypoint: string]: ComponentEntry
}

interface ComponentEntry {
  assets: string[]
  dependencies: string[]
}

// We need to keep this so this file is kept in type generation
export default {}
