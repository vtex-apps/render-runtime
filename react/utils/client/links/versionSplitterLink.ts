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

export const versionSplitterLink = new ApolloLink((operation: Operation, forward?: NextLink) => {
  const operations = operationByContextDirective(operation)

  return forward ? new Observable(observer => {
    const datas: any[] = []
    let sent = false

    operations.forEach((op: Operation) => forward(op).subscribe({
      complete: () => {
        if (!sent && datas.length === operations.length) {
          sent = true
          observer.next(datas.reduce(mergeRecursively))
        }
      },
      error: (err) => {
        datas.push({})
        observer.error(err)
      },
      next: (data) => datas.push(data),
    }))
  }) :
  null
})
