/*
 * This file defines a linker middleware used for changing http verbs, allowing
 * cache in CDNs and other http-based caching content delivery networks
 *
 * If the query type is Query, the request will be made using an HTTP GET
 * If the query type is Mutation, the request will be made using HTTP POST
 *
 */
import {ApolloLink} from 'apollo-link'
import { prop, map, contains, isEmpty, isNil } from 'ramda'
import { parse, stringify } from 'querystring'
import { print } from 'graphql'

function removeUnusedFields(obj) {
  Object.keys(obj).forEach(key => (isNil(obj[key]) || isEmpty(obj[key])) && delete obj[key])

  return obj
}

export const createHttpSwitchLink = (uri) => {
  const [baseUrl, querystring] = uri.split('?')
  let queryObj = (querystring) ? parse(querystring) : {}

  return new ApolloLink((operation, forward) => {
    let targetUri = uri
    const {query, variables, operationName} = operation
    const {fetchOptions = {}, http: httpOptions = {}} = operation.getContext()
    const method = contains('mutation',map(prop('operation'), prop('definitions')(query))) ?
      'POST' :
      'GET'

    if(method === 'GET') {
      fetchOptions['method'] = method

      const fullQueryObj = removeUnusedFields({
        ...queryObj,
        'query': print(query).replace(/\s\s+/g, ' '),
        variables,
        operationName
      })

      targetUri = baseUrl.concat(`?${stringify(fullQueryObj)}`)
    }

    operation.setContext({uri: targetUri, fetchOptions})
    return forward(operation)
  })
}

export const httpSwitchFetcher = (uri, options) => {
  if(options.method === 'GET' && options.body) {
    delete options.body
  }

  return fetch(uri, options)
}
