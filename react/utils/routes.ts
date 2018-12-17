import defaultPage from '../queries/defaultPage.graphql'
import navigationPageQuery from '../queries/navigationPage.graphql'
import pageQuery from '../queries/Page.graphql'
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

export const fetchRoutes = ({
  apolloClient,
  conditions,
  device,
  locale,
  page,
  paramsJSON,
  path,
  production,
  renderMajor,
  scope,
  template,
}: FetchRoutesInput) => apolloClient.query<{page: PageQueryResponse}>({
  fetchPolicy: production ? 'cache-first' : 'network-only',
  query: pageQuery,
  variables: {
    conditions,
    device,
    locale,
    page,
    params: paramsJSON,
    path,
    production,
    renderMajor,
    scope,
    template,
  }
}).then<ParsedPageQueryResponse>(({data: {page: pageData}, errors}: GraphQLResult<'page', PageQueryResponse>) =>
      errors ? Promise.reject(errors) : parsePageQueryResponse(pageData))

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
  pagesProtocol,
  renderMajor,
}: FetchDefaultPages) => {

  const queryPromise = pagesProtocol >= 2
    ? apolloClient.query<{defaultPages: DefaultPagesQueryResponse}>({
        query: routePreviews,
        variables: {locale, renderMajor, routes: getRoutesParam(routeIds, pages)}
      })
    : apolloClient.query<{defaultPages: DefaultPagesQueryResponse}>({
        query: defaultPage,
        variables: {locale, routeIds}
      })

  return queryPromise.then<ParsedDefaultPagesQueryResponse>(
    ({data: {defaultPages}, errors}: DefaultPagesQueryResult) => {
      return errors ? Promise.reject(errors) : parseDefaultPagesQueryResponse(defaultPages)
    }
  )
}
