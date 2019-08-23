import { isEmpty } from 'ramda'
import { stringify } from 'query-string'

import routePreviews from '../queries/routePreviews.graphql'
import { generateExtensions } from './blocks'
import { parseMessages } from './messages'

const parsePageQueryResponse = (
  page: PageQueryResponse
): ParsedPageQueryResponse => {
  const {
    blocksTree,
    blocks,
    contentMap,
    extensions: pageExtensions,
    pages,
    route,
    route: { routeId },
  } = page

  const extensions =
    !isEmpty(blocksTree) && blocksTree && blocks && contentMap
      ? generateExtensions(blocksTree, blocks, contentMap, pages[routeId])
      : pageExtensions

  return {
    ...page,
    extensions,
    matchingPage: route,
  }
}

const parseDefaultPagesQueryResponse = (
  defaultPages: DefaultPagesQueryResponse
): ParsedDefaultPagesQueryResponse => {
  const { componentsJSON, extensionsJSON, messages } = defaultPages

  const [components, extensions] = [componentsJSON, extensionsJSON].map(json =>
    JSON.parse(json)
  )

  return {
    components,
    extensions,
    messages: parseMessages(messages),
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

export const fetchNavigationPage = ({
  path,
  query: rawQuery,
}: {
  path: string
  query?: Record<string, string>
}) => {
  const query = stringify({
    ...rawQuery,
    __pickRuntime: runtimeFields,
  })
  const url = `${path}?${query}`
  return fetch(url)
    .then(response => response.json())
    .then(parsePageQueryResponse)
}

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
