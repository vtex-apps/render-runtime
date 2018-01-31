/*
 * This file defines a linker middleware used for changing http verbs, allowing
 * cache in CDNs and other http-based caching content delivery networks
 *
 * If the query type is Query, the request will be made using an HTTP GET
 * If the query type is Mutation, the request will be made using HTTP POST
 *
 */
import {ApolloLink} from 'apollo-link'
import {parse, format} from 'url'
import {print} from 'graphql'

const isEmpty = (val) => (val == undefined || Object.keys(val).length === 0)

function removeUnusedFields(obj) {
  Object.keys(obj).forEach(key => (isEmpty(obj[key])) && delete obj[key])

  return obj
}

const hasMutationField = (queryTree) => {
  for (let query of queryTree.definitions) {
    if (query.operation === 'mutation') {
      return true
    }
  }
  return false
}

export const createHttpSwitchLink = (uri) => {
  const parsedUri = parse(uri, true)
  // Delete search in order to format to use query, instead of search, field while
  // formatting the new URI
  delete parsedUri.search

  return new ApolloLink((operation, forward) => {
    const targetUri = Object.assign({}, parsedUri)
    const {query, variables, operationName} = operation
    const {fetchOptions = {}} = operation.getContext()
    const method = hasMutationField(query) ? 'POST' : 'GET'

    if(method === 'GET') {
      fetchOptions['method'] = method

      targetUri.query = removeUnusedFields({
        ...targetUri.query,
        'query': print(query).replace(/\s\s+/g, ' '),
        variables,
        operationName
      })
    }

    operation.setContext({uri: format(targetUri), fetchOptions})
    return forward(operation)
  })
}

export const httpSwitchFetcher = (uri, options) => {
  if(options.method === 'GET' && options.body) {
    delete options.body
  }

  return fetch(uri, options)
}
