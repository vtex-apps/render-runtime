import pageQuery from './Page.graphql'

const parsePageQueryResponse = (page: PageQueryResponse): ParsedPageQueryResponse => {
  const {
    appsEtag,
    appsSettingsJSON,
    cacheHintsJSON,
    componentsJSON,
    extensionsJSON,
    messagesJSON,
    pageContext,
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
    pageContext,
    pages,
    settings
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
    template,
  }
}).then<ParsedPageQueryResponse>(({data: {page: pageData}, errors}: PageQueryResult) =>
      errors ? Promise.reject(errors) : parsePageQueryResponse(pageData))
