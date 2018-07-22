import {Observable} from 'apollo-link'
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
  params,
  path,
  production,
  renderMajor,
  scope,
  template,
}: FetchRoutesInput) => new Observable((observer) => {
  const subscription = apolloClient.watchQuery<{page: PageQueryResponse}>({
    fetchPolicy: 'cache-and-network',
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
  }).subscribe({
    complete: () => observer.complete(),
    error: (err) => observer.error(err),
    next: ({data, errors}) => {
      if (errors) {
        observer.error(errors)
      }
      if (data && data.page) {
        observer.next(parsePageQueryResponse(data.page))
      }
    }
  })

  return () => subscription.unsubscribe()
})
