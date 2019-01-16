import navigationPageQuery from '../queries/navigationPage.graphql'
import routePreviews from '../queries/routePreviews.graphql'

const parsePageQueryResponse = (page: PageQueryResponse): ParsedPageQueryResponse => {
  const {
    appsEtag,
    appsSettingsJSON,
    cacheHintsJSON,
    componentsJSON,
    extensionsJSON,
    messagesJSON,
    pagesJSON,
  } = page

  const [cacheHints, components, extensions, messages, pages, settings] = [
    cacheHintsJSON,
    componentsJSON,
    extensionsJSON,
    messagesJSON,
    pagesJSON,
    appsSettingsJSON,
  ].map(json => JSON.parse(json))

  return {
    appsEtag,
    cacheHints,
    components,
    extensions,
    messages,
    pages,
    settings
  }
}

const parseDefaultPagesQueryResponse = (defaultPages: DefaultPagesQueryResponse): ParsedDefaultPagesQueryResponse => {
  const {
    componentsJSON,
    extensionsJSON,
    messagesJSON,
  } = defaultPages

  const [components, extensions, messages] = [
    componentsJSON,
    extensionsJSON,
    messagesJSON,
  ].map(json => JSON.parse(json))

  return {
    components,
    extensions,
    messages,
  }
}

export const fetchNavigationPage = ({
  apolloClient,
  locale,
  routeId,
  declarer,
  production,
  paramsJSON,
  renderMajor
}: FetchNavigationDataInput) => apolloClient.query<{navigationPage: PageQueryResponse}>({
  fetchPolicy: production ? 'cache-first' : 'network-only',
  query: navigationPageQuery,
  variables: {
    declarer,
    locale,
    params: paramsJSON,
    production,
    renderMajor,
    routeId,
  }
}).then<ParsedPageQueryResponse>(({data: {navigationPage: pageData}, errors}: GraphQLResult<'navigationPage', PageQueryResponse>) =>
      errors ? Promise.reject(errors) : parsePageQueryResponse(pageData))

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
  locale,
  pages,
  routeIds,
  renderMajor,
}: FetchDefaultPages) => {
  return apolloClient.query<{defaultPages: DefaultPagesQueryResponse}>({
    query: routePreviews,
    variables: {locale, renderMajor, routes: getRoutesParam(routeIds, pages)}
  }).then<ParsedDefaultPagesQueryResponse>(
    ({data: {defaultPages}, errors}: DefaultPagesQueryResult) => {
      return errors ? Promise.reject(errors) : parseDefaultPagesQueryResponse(defaultPages)
    }
  )
}
