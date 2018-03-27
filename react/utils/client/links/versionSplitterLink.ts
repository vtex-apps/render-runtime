import {ApolloLink, createOperation, FetchResult, GraphQLRequest, NextLink, Observable, Operation, RequestHandler} from 'apollo-link'
import {transformOperation, validateOperation} from 'apollo-link/lib/linkUtils'
import {ASTKindToNode, DefinitionNode, DirectiveNode, DocumentNode, FieldNode, GraphQLNonNull, Kind, OperationDefinitionNode, OperationTypeDefinitionNode, parse, print, SelectionNode, SelectionSetNode, visit} from 'graphql'
import {queriesByContextDirective} from 'vtex-graphql-utils'

const mergeRecursively = (accumulator: any, value: any) => {
  Object.keys(value).forEach(key => {
    if (accumulator[key] && typeof value[key] === 'object') {
      accumulator[key] = mergeRecursively(accumulator[key], value[key])
    } else {
      accumulator[key] = value[key]
    }
  })
  return accumulator
}

const createOperationForQuery = (operation: Operation) => (query: DocumentNode) => {
  const graphQLRequest = {...operation, query} as GraphQLRequest
  const op = validateOperation(transformOperation(graphQLRequest))
  return createOperation(operation.getContext(), op)
}

const operationByContextDirective = (operation: Operation) => {
  const queryToOperation = createOperationForQuery(operation)
  const queries = queriesByContextDirective(operation.query)
  return queries.map(queryToOperation)
}

const observableFromOperations = (operations: Operation[], forward: NextLink) => new Observable(observer => {
  const datas: any[] = []
  let sent = false

  operations.forEach((op: Operation) => forward(op).subscribe({
    complete: () => {
      if (!sent && datas.length === operations.length) {
        sent = true
        observer.next(datas.reduce(mergeRecursively))
        observer.complete()
      }
    },
    error: (err) => {
      datas.push({})
      observer.error(err)
    },
    next: (data) => datas.push(data),
  }))
})

export const versionSplitterLink = new ApolloLink((operation: Operation, forward?: NextLink) => {
  const operations = operationByContextDirective(operation)

  if (forward) {
    return operations.length ?
      observableFromOperations(operations, forward) :
      forward(operation)
  }
  return null
})
