import { stringify } from 'query-string'
import { isEmpty } from 'ramda'

import navigationPageQuery from '../queries/navigationPage.graphql'
import routePreviews from '../queries/routePreviews.graphql'
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
  const query = stringify({
    ...rawQuery,
    __pickRuntime: runtimeFields,
  })
  const url = `${path}?${query}`
  const page: ServerPageResponse = await fetchWithRetry(url, {
    credentials: 'same-origin',
    headers: {
      accept: 'application/json',
    },
    fetcher,
  }).then(({ response }) => response.json())
  const {
    blocksTree,
    blocks,
    contentMap,
    extensions: pageExtensions,
    pages,
    route,
    route: { routeId },
  } = page
  const routePath = `${path}?${stringify(rawQuery || {})}`

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
