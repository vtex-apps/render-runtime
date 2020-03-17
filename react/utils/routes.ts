import { stringify } from 'query-string'
import { isEmpty } from 'ramda'
import { format, parse } from 'url'

import navigationPageQuery from '../queries/navigationPage.graphql'
import routePreviews from '../queries/routePreviews.graphql'
import { fetchAssets } from './assets'
import { generateExtensions } from './blocks'
import { traverseListOfComponents } from './components'
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
  ].map(json => JSON.parse(json))

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

export const runtimeFields = [
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

export const prefetchCache = new Map<string, Promise<ServerPageResponse>>()

export const getOrFetchServerPage = async ({
  fetcher,
  path,
  query: rawQuery,
}: {
  path: string
  query?: Record<string, string>
  fetcher: GlobalFetch['fetch']
}) => {
  const parsedUrl = parse(path)
  parsedUrl.search = undefined
  parsedUrl.path = undefined
  parsedUrl.href = undefined
  parsedUrl.query = {
    ...rawQuery,
    __pickRuntime: runtimeFields,
  } as any

  if (parsedUrl.pathname?.endsWith('/') && parsedUrl.pathname?.length > 1) {
    parsedUrl.path = parsedUrl.pathname.slice(0, parsedUrl.pathname.length - 1)
  }

  const url = format(parsedUrl)

  if (prefetchCache.has(url)) {
    // console.log('cache HIT')

    return prefetchCache.get(url)
  }

  // console.log('cache MISS', url, prefetchCache.keys())

  const pagePromise = fetchWithRetry(
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
    .then(runtime => {
      const assets = traverseListOfComponents(
        runtime.components,
        Object.keys(runtime.components)
      )
      fetchAssets(runtime, assets)
      return runtime
    })

  prefetchCache.set(url, pagePromise)

  return pagePromise
}

export const fetchServerPage = async ({
  fetcher,
  path,
  query: rawQuery,
}: {
  path: string
  query?: Record<string, string>
  fetcher: GlobalFetch['fetch']
}): Promise<ParsedServerPageResponse> => {
  const page: ServerPageResponse = await getOrFetchServerPage({
    fetcher,
    path,
    query: rawQuery,
  })
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
    .filter(routeId => routeId in pages)
    .map(routeId => {
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
