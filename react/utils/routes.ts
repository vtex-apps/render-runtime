import routesQuery from './routes.graphql'

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
  locale,
  page,
  path,
  production,
  renderMajor,
  renderVersion,
}: FetchRoutesInput) => apolloClient.query<{page: PageQueryResponse}>({
  query: routesQuery,
  variables: {
      locale,
      page,
      path,
      production,
      renderMajor,
      renderVersion,
    }
}).then<ParsedPageQueryResponse>(({data: {page: pageData}, errors}: PageQueryResult) =>
      errors ? Promise.reject(errors) : parsePageQueryResponse(pageData))
