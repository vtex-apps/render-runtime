import { ApolloLink, Observable, RequestHandler, Operation } from 'apollo-link'
import { print } from 'graphql'
import { path, map, contains } from 'ramda'

const throwServerError = (response, result, message) => {
  const error = new Error(message)

  error.response = response
  error.statusCode = response.status
  error.result = result

  throw error
}

const parseAndCheckResponse = request => (response) => {
  return response
    .text()
    .then(bodyText => {
      try {
        return JSON.parse(bodyText)
      } catch (err) {
        const parseError = err
        parseError.response = response
        parseError.statusCode = response.status
        parseError.bodyText = bodyText
        return Promise.reject(parseError)
      }
    })
    .then(result => {
      if (response.status >= 300) {
        //Network error
        throwServerError(
          response,
          result,
          `Response not successful: Received status code ${response.status}`,
        )
      }
      if (!result.hasOwnProperty('data') && !result.hasOwnProperty('errors')) {
        //Data error
        throwServerError(
          response,
          result,
          `Server response was missing for query '${request.operationName}'.`,
        )
      }
      return result
    })
}

const checkFetcher = (fetcher) => {
  if ((fetcher).use) {
    throw new Error(`
      It looks like you're using apollo-fetch! Apollo Link now uses native fetch
      implementation, so apollo-fetch is not needed. If you want to use your existing
      apollo-fetch middleware, please check this guide to upgrade:
        https://github.com/apollographql/apollo-link/blob/master/docs/implementation.md
    `)
  }
}

const warnIfNoFetch = fetcher => {
  if (!fetcher && typeof fetch === 'undefined') {
    let library = 'unfetch'
    if (typeof window === 'undefined') library = 'node-fetch'
    throw new Error(
      `fetch is not found globally and no fetcher passed, to fix pass a fetch for
      your environment like https://www.npmjs.com/package/${library}.

      For example:
        import fetch from '${library}'
        import { createHttpLink } from 'apollo-link-http'

        const link = createHttpLink({ uri: '/graphql', fetch: fetch })
      `,
    )
  }
}

const createSignalIfSupported = () => {
  if (typeof AbortController === 'undefined')
    return { controller: false, signal: false }

  const controller = new AbortController()
  const signal = controller.signal
  return { controller, signal }
}

const defaultHttpOptions = {
  includeQuery: true,
  includeExtensions: false,
}

export const createHttpLink = (linkOptions = {}) => {
  let {
    uri,
    fetch: fetcher,
    includeExtensions,
    ...requestOptions
  } = linkOptions
  // dev warnings to ensure fetch is present
  warnIfNoFetch(fetcher)
  if (fetcher) checkFetcher(fetcher)

  // use default global fetch is nothing passed in
  if (!fetcher) fetcher = fetch
  if (!uri) uri = '/graphql'

  return new ApolloLink(
    operation =>
      new Observable(observer => {
        const {
          headers,
          credentials,
          fetchOptions = {},
          uri: contextURI,
          http: httpOptions = {},
        } = operation.getContext()
        const { operationName, extensions, variables, query } = operation
        const http = { ...defaultHttpOptions, ...httpOptions }

        // Sets method to GET if all query types are Query, POST otherwise, with fetchOptions as precedence
        let method = fetchOptions.method ||
          contains('mutation',map(path(['operation']), path(['definitions'], query))) ?
            'POST' :
            'GET'

        let options = fetchOptions
        if (requestOptions.fetchOptions)
          options = { ...requestOptions.fetchOptions, ...options }
        const fetcherOptions = {
          method,
          ...options,
          headers: {
            // headers are case insensitive (https://stackoverflow.com/a/5259004)
            accept: '*/*',
            'content-type': 'application/json',
          }
        }

        let targetUri = contextURI || uri

        try {
          if (method === 'GET') {
            targetUri = targetUri + '&query=' + encodeURI(print(query))
          }
          else {
            const body = { operationName, variables }

            if (includeExtensions || http.includeExtensions) body.extensions = extensions

            // not sending the query (i.e persisted queries)
            if (http.includeQuery) body.query = print(query)

            fetcherOptions.body = JSON.stringify(body)
          }
        } catch(e) {
          const parseError = new Error(
            `Network request failed. Payload is not serializable: ${e.message}`,
          )
          parseError.parseError = e
          throw parseError
        }


        if (requestOptions.credentials)
          fetcherOptions.credentials = requestOptions.credentials
        if (credentials) fetcherOptions.credentials = credentials

        if (requestOptions.headers)
          fetcherOptions.headers = {
            ...fetcherOptions.headers,
            ...requestOptions.headers,
          }
        if (headers)
          fetcherOptions.headers = { ...fetcherOptions.headers, ...headers }

        const { controller, signal } = createSignalIfSupported()
        if (controller) fetcherOptions.signal = signal

        fetcher(targetUri, fetcherOptions)
          // attach the raw response to the context for usage
          .then(response => {
            operation.setContext({ response })
            return response
          })
          .then(parseAndCheckResponse(operation))
          .then(result => {
            // we have data and can send it to back up the link chain
            observer.next(result)
            observer.complete()
            return result
          })
          .catch(err => {
            // fetch was cancelled so its already been cleaned up in the unsubscribe
            if (err.name === 'AbortError') return
            observer.error(err)
          })

        return () => {
          // XXX support canceling this request
          // https://developers.google.com/web/updates/2017/09/abortable-fetch
          if (controller) controller.abort()
        }
      }),
  )
}

export class HttpLink extends ApolloLink {
  requester
  constructor(opts) {
    super(createHttpLink(opts).request)
  }
}
