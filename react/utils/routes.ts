import defaultPage from './defaultPage.graphql'
import pageQuery from './Page.graphql'

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
  params,
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
    params,
    path,
    production,
    renderMajor,
    scope,
    template,
  }
}).then<ParsedPageQueryResponse>(({data: {page: pageData}, errors}: PageQueryResult) =>
      errors ? Promise.reject(errors) : parsePageQueryResponse(pageData))

export const fetchDefaultPages = ({
  apolloClient,
  locale,
  routeIds,
}: FetchDefaultPages) => apolloClient.query<{defaultPages: DefaultPagesQueryResponse}>({
  query: defaultPage,
  variables: {
    locale,
    routeIds
  }
}).then<ParsedDefaultPagesQueryResponse>(({data: {defaultPages}, errors}: DefaultPagesQueryResult) =>
  errors ? Promise.reject(errors) : parseDefaultPagesQueryResponse(defaultPages))
