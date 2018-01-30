/*
 * This file defines a linker middleware used for changing http verbs, allowing
 * cache in CDNs and other http-based caching content delivery networks
 *
 * If the query type is Query, the request will be made using an HTTP GET
 * If the query type is Mutation, the request will be made using HTTP POST
 *
 */
///////////////////////////////////////////////////////////////////////////////

import {ApolloLink} from 'apollo-link'
import { prop, map, contains, isEmpty, isNil } from 'ramda'
import { parse, stringify } from 'querystring'
import { print } from 'graphql'

///////////////////////////////////////////////////////////////////////////////

function removeUnusedFields(obj) {
  Object.keys(obj).forEach(key => (isNil(obj[key]) || isEmpty(obj[key])) && delete obj[key])

  return obj
}

///////////////////////////////////////////////////////////////////////////////

export const createHttpSwitchLink = (uri) => new ApolloLink((operation, forward) => {
  const {query, variables, operationName} = operation
  const {fetchOptions = {}, http: httpOptions = {}} = operation.getContext()
  const method = contains('mutation',map(prop('operation'), prop('definitions')(query))) ?
    'POST' :
    'GET'

  // If method is GET, we need to set the querystring correctly
  if(method === 'GET') {
    fetchOptions['method'] = method

    // Retrieves base URL and querystring from URL
    const [baseUrl, querystring] = uri.split('?')

    // Transforms it back into a JSON
    let queryObj = (querystring) ? parse(querystring) : {}

    // Builds a new query object to be send as querystring
    queryObj = removeUnusedFields({
      ...queryObj,
      'query': print(query).replace(/\s\s+/g, ' '),
      variables,
      operationName
    })

    // Stringify the JSON and set it as the new querystring for the target URL
    uri = baseUrl.concat(`?${stringify(queryObj)}`)
  }

  // Sets the new URI and fetchOptions to the operation context and return
  operation.setContext({uri, fetchOptions})
  return forward(operation)
})

///////////////////////////////////////////////////////////////////////////////
// Custom fetcher to remove body in GET requests
export const httpSwitchFetcher = (uri, options) => {
  if(options.method === 'GET' && options.body) {
    delete options.body
  }

  return fetch(uri, options)
}

///////////////////////////////////////////////////////////////////////////////
