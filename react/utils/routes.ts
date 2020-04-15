import { stringify } from 'query-string'
import { isEmpty } from 'ramda'
import { parse, format } from 'url'

import navigationPageQuery from '../queries/navigationPage.graphql'
import routePreviews from '../queries/routePreviews.graphql'
import routeDataQuery from '../queries/routeData.graphql'
import { generateExtensions } from './blocks'
import { fetchWithRetry } from './fetch'
import { parseMessages } from './messages'

const parsePageQueryResponse = (
  page: PageQueryResponse
): ParsedPageQueryResponse => {
  const {
    appsEtag,
    appsSettingsJSON,
    blocksJSON,
    blocksTreeJSON,
    contentMapJSON,
    cacheHintsJSON,
    componentsJSON,
    extensionsJSON,
    messages,
    pagesJSON,
    page: {
      blockId,
      canonicalPath,
      metaTags,
      pageContext: { id, type },
      routeId,
      title,
    },
  } = page

  const [
    blocks,
    blocksTree,
    contentMap,
    cacheHints,
    components,
    pages,
    settings,
  ] = [
    blocksJSON,
    blocksTreeJSON,
    contentMapJSON,
    cacheHintsJSON,
    componentsJSON,
    pagesJSON,
    appsSettingsJSON,
  ].map((json) => JSON.parse(json))

  const extensions = isEmpty(blocksTree)
    ? JSON.parse(extensionsJSON)
    : generateExtensions(blocksTree, blocks, contentMap, pages[routeId])

  return {
    appsEtag,
    cacheHints,
    blocks,
    blocksTree,
    contentMap,
    components,
    extensions,
    matchingPage: {
      blockId,
      canonicalPath,
      metaTags,
      pageContext: { id, type },
      routeId,
      title,
    },
    messages: parseMessages(messages),
    pages,
    settings,
  }
}

const parseDefaultPagesQueryResponse = (
  defaultPages: DefaultPagesQueryResponse
): ParsedDefaultPagesQueryResponse => {
  const { componentsJSON } = defaultPages
  const components = JSON.parse(componentsJSON)
  return {
    components,
  }
}

const runtimeFields = [
  'appsEtag',
  'blocks',
  'blocksTree',
  'components',
  'contentMap',
  'extensions',
  'messages',
  'page',
  'pages',
  'query',
  'queryData',
  'route',
  'runtimeMeta',
  'settings',
].join(',')

export const fetchServerPage = async ({
  fetcher,
  path,
  query: rawQuery,
}: {
  path: string
  query?: Record<string, string>
  fetcher: GlobalFetch['fetch']
}): Promise<ParsedServerPageResponse> => {
  const parsedUrl = parse(path)
  parsedUrl.search = undefined
  parsedUrl.query = {
    ...rawQuery,
    __pickRuntime: runtimeFields,
  } as any
  const url = format(parsedUrl)
  const page: ServerPageResponse = await fetchWithRetry(
    url,
    {
      credentials: 'same-origin',
      headers: {
        accept: 'application/json',
      },
    },
    fetcher
  ).then(({ response }) => response.json())
  const {
    blocksTree,
    blocks,
    contentMap,
    extensions: pageExtensions,
    pages,
    route,
    route: { routeId },
    queryData,
  } = page
  if (routeId === 'redirect') {
    window.location.href = route.path
  }

  const queryString = stringify(rawQuery || {})
  const routePath = `${path}${queryString ? '?' + queryString : queryString}`

  const extensions =
    !isEmpty(blocksTree) && blocksTree && blocks && contentMap
      ? generateExtensions(blocksTree, blocks, contentMap, pages[routeId])
      : pageExtensions

  return {
    ...page,
    extensions,
    matchingPage: {
      ...route,
      path: routePath,
    },
    queryData,
  }
}

interface PrefetchPageResponse {
  page: string
  queryData: RenderRuntime['queryData']
  contentResponse: ContentResponse | null
  route: RenderRuntime['route']
}

export const getPrefetchForPath = async ({
  fetcher,
  path,
  query: rawQuery,
}: {
  path: string
  query?: Record<string, string>
  fetcher: GlobalFetch['fetch']
}): Promise<PrefetchPageResponse> => {
  const parsedUrl = parse(path)
  parsedUrl.search = undefined
  parsedUrl.query = {
    ...rawQuery,
    __pickRuntime: 'page,queryData,contentResponse,route',
  } as any
  const url = format(parsedUrl)
  const pageResponse: PrefetchPageResponse = await fetchWithRetry(
    url,
    {
      credentials: 'same-origin',
      headers: {
        accept: 'application/json',
      },
    },
    fetcher
  )
    .then(({ response }) => response.json())
    .catch(() => null)
  return pageResponse
}

const parseFecthRouteData = (data: PrefetchBlocks): PrefetchRouteData => {
  console.log('tetse PARSING DATA: ', data)
  return {
    extensions: JSON.parse(data.extensionsJSON),
    components: JSON.parse(data.componentsJSON),
    messages: parseMessages(data.messages),
  }
}

const getDeviceFromHint = (hints: RenderRuntime['hints']) => {
  if (hints.desktop) {
    return 'desktop'
  }
  if (hints.phone) {
    return 'phone'
  }
  if (hints.tablet) {
    return 'tablet'
  }
  return 'unknown'
}

interface FetchRouteDataArgs {
  apolloClient: ApolloClientType
  routeId: string
  declarer: string | null
  query?: string
  hints: RenderRuntime['hints']
  renderMajor: number
}

interface PrefetchBlocksQueryVars {
  routeId: string
  declarer: string | null
  query?: string
  device: 'desktop' | 'phone' | 'tablet' | 'unknown'
  renderMajor: number
}

interface PrefetchBlocksQueryResult {
  prefetchBlocks: PrefetchBlocks
}

interface PrefetchBlocks {
  extensionsJSON: string
  componentsJSON: string
  messages: KeyedString[]
}

export const fetchRouteData = ({
  apolloClient,
  routeId,
  declarer,
  query,
  hints,
  renderMajor,
}: FetchRouteDataArgs) =>
  apolloClient
    .query<PrefetchBlocksQueryResult, PrefetchBlocksQueryVars>({
      fetchPolicy: 'no-cache',
      query: routeDataQuery,
      variables: {
        declarer,
        query,
        routeId,
        device: getDeviceFromHint(hints),
        renderMajor,
      },
    })
    .then(({ data: { prefetchBlocks }, errors }) =>
      errors ? Promise.reject(errors) : parseFecthRouteData(prefetchBlocks)
    )

export const fetchNavigationPage = ({
  apolloClient,
  routeId,
  declarer,
  production,
  paramsJSON,
  renderMajor,
  skipCache,
  query,
}: FetchNavigationDataInput) =>
  apolloClient
    .query<{ navigationPage: PageQueryResponse }>({
      fetchPolicy: production && !skipCache ? 'cache-first' : 'network-only',
      query: navigationPageQuery,
      variables: {
        declarer,
        params: paramsJSON,
        production,
        query,
        renderMajor,
        routeId,
      },
    })
    .then<ParsedPageQueryResponse>(
      ({
        data: { navigationPage: pageData },
        errors,
      }: GraphQLResult<'navigationPage', PageQueryResponse>) =>
        errors ? Promise.reject(errors) : parsePageQueryResponse(pageData)
    )

const getRoutesParam = (routeIds: string[], pages: Pages) => {
  return routeIds
    .filter((routeId) => routeId in pages)
    .map((routeId) => {
      const page = pages[routeId]
      return {
        declarer: page.declarer,
        routeId,
      }
    })
}

export const fetchDefaultPages = ({
  apolloClient,
  pages,
  routeIds,
  renderMajor,
}: FetchDefaultPages) => {
  return apolloClient
    .query<{ defaultPages: DefaultPagesQueryResponse }>({
      query: routePreviews,
      variables: { renderMajor, routes: getRoutesParam(routeIds, pages) },
    })
    .then<ParsedDefaultPagesQueryResponse>(
      ({ data: { defaultPages }, errors }: DefaultPagesQueryResult) => {
        return errors
          ? Promise.reject(errors)
          : parseDefaultPagesQueryResponse(defaultPages)
      }
    )
}
