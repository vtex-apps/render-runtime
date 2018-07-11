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

export const fetchRoutes = ({
  apolloClient,
  conditions,
  device,
  locale,
  page,
  path,
  production,
  renderMajor,
  scope,
  template,
}: FetchRoutesInput) => apolloClient.query<{page: PageQueryResponse}>({
  fetchPolicy: 'network-only',
  query: pageQuery,
  variables: {
    conditions,
    device,
    locale,
    page,
    path,
    production,
    renderMajor,
    scope,
    template,
  }
}).then<ParsedPageQueryResponse>(({data: {page: pageData}, errors}: PageQueryResult) =>
      errors ? Promise.reject(errors) : parsePageQueryResponse(pageData))
