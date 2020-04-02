import { stringify } from 'query-string'
import { isEmpty } from 'ramda'
import { parse, format } from 'url'

import navigationPageQuery from '../queries/navigationPage.graphql'
import routePreviews from '../queries/routePreviews.graphql'
import routeDataQuery from '../queries/routeData.graphql'
import pageContentQuery from '../queries/pageContent.graphql'
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

export const getPageForPath = async ({
  fetcher,
  path,
  query: rawQuery,
}: {
  path: string
  query?: Record<string, string>
  fetcher: GlobalFetch['fetch']
}): Promise<any> => {
  const parsedUrl = parse(path)
  parsedUrl.search = undefined
  parsedUrl.query = {
    ...rawQuery,
    // __pickRuntime: 'page,route,queryData,contentResponse',
    __pickRuntime: 'page,queryData,contentResponse,route',
  } as any
  const url = format(parsedUrl)
  // console.log('teste url: ', {url, path, parsedUrl})
  const pageResponse: ServerPageResponse = await fetchWithRetry(
    url,
    {
      credentials: 'same-origin',
      headers: {
        accept: 'application/json',
      },
    },
    fetcher
  ).then(({ response }) => response.json())
    .catch(error => {
      console.log('teste PAGE with error: ', { error, url, path, parsedUrl })
    })
  // const {
  //   page,
  //   route,
  //   queryData,
  // } = pageResponse
  // console.log('teste REQUESTED PAGE: ', {page, url, path, parsedUrl})
  return pageResponse
}

const parseFecthRouteData = (data: any) => {
  const { page: {
    blockId,
    canonicalPath,
    metaTags,
    pageContext: { id, type },
    routeId,
    title,
    domain,
    routeContextLocator
  } } = data
  // const queryString = stringify(rawQuery || {})
  // const routePath = `${path}${queryString ? '?' + queryString : queryString}`
  return {
    blocks: JSON.parse(data.blocksJSON),
    blocksTree: JSON.parse(data.blocksTreeJSON),
    blocksTreeJSON: data.blocksTreeJSON,
    blocksJSON: data.blocksJSON,
    components: JSON.parse(data.componentsJSON),
    contentMap: JSON.parse(data.contentMapJSON),
    messages: data.messages,
    matchingPage: {
      blockId,
      canonicalPath,
      metaTags,
      pageContext: { id, type },
      routeId,
      title,
      domain,
      routeContextLocator
    },
  }
}

export const getPageContent = (client: any, blocksResponse: any, route: any) => {
  const { matchingPage: { domain, routeContextLocator, routeId } } = blocksResponse
  const removedPickQs = route.path.replace(/(\&?__pickRuntime=[^\&]*)/, '')
  const removedPickQsLength = removedPickQs.length
  const cleanPath = removedPickQs[removedPickQsLength - 1] === '?' || removedPickQs[removedPickQsLength - 1] === '&' ? removedPickQs.slice(0, removedPickQsLength - 1) : removedPickQs
  // queryString
  const { __pickRuntime: _, ...cleanQueryString } = route.queryString
  const vars = {
    input: {
      // blocksMap: blocksResponse.blocksJSON,
      // blocksTree: blocksResponse.blocksTreeJSON,
      blocksMap: '{}',
      blocksTree: '{}',
      domain,
      params: JSON.stringify(route.params),// vem do route
      path: cleanPath, //vem do route
      query: JSON.stringify(cleanQueryString),
      renderMajor: 8,
      resolvedContentType: route.pageContext,
      routeContextLocator,
      routeId,
    }
  }
  console.log('teste pageContent query: ', vars)

  return client.query({
    query: pageContentQuery,
    variables: vars,
  }).then(data => {
    console.log('teste result data: ', data)
    return data
  }).catch(error => {
    console.log('teste pageContent error:', error)
  })
}


  // const backToExtensions = blocksResponse.extensionsJSON !== '{}'
  // // console.log('')
  // return this.graphql.query<any, any>({
  //   query: backToExtensions ? newPageContentQuery : pageContentQuery,
  //   variables: {
  //     input: {
  //       ...backToExtensions
  //         ? {
  //           extensions: blocksResponse.extensionsJSON,
  //         } : {
  //           blocksMap: blocksResponse.blocksJSON,
  //           blocksTree: blocksResponse.blocksTreeJSON,
  //         },
  //       depTree: JSON.stringify(depTree),
  //       domain,
  //       params: JSON.stringify(params),
  //       path,
  //       query: JSON.stringify(query),
  //       renderMajor,
  //       resolvedContentType: resolvedContentType && {
  //         id: resolvedContentType.id,
  //         type: resolvedContentType.type,
  //       },
  //       routeContextLocator,
  //       routeId,
  //     },
  //   }

  export const fetchRouteData = ({
    apolloClient,
    routeId,
    declarer,
    // production,
    // renderMajor,
    // skipCache,
    query,
  }: any) =>
    apolloClient
      .query({
        // fetchPolicy: production && !skipCache ? 'cache-first' : 'network-only',
        query: routeDataQuery,
        variables: {
          declarer,
          // production,
          query,
          routeId,
        },
      })
      .then(
        ({
          data: { pageBlocksOld },
          errors,
        }: any) => errors ? Promise.reject(errors) : parseFecthRouteData(pageBlocksOld)
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
