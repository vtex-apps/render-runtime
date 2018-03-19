import {ApolloLink, createOperation, FetchResult, GraphQLRequest, NextLink, Observable, Operation, RequestHandler} from 'apollo-link'
import {transformOperation, validateOperation} from 'apollo-link/lib/linkUtils'
import {DefinitionNode, DocumentNode, FieldNode, Kind, OperationDefinitionNode, OperationTypeDefinitionNode, parse, print, SelectionNode, visit, GraphQLNonNull} from 'graphql'

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

const setSelectionToQuery = (selection: SelectionNode) => ({
  OperationDefinition (node: OperationDefinitionNode) {
    node.selectionSet.selections = [selection]
  }
})

const selectionsByGraphQLVersion = (selections: SelectionNode[]) => ({
  OperationDefinition (node: OperationDefinitionNode) {
    node.selectionSet.selections.forEach(s => selections.push(s))
  }
})

const createQueryBySelection = (query: DocumentNode) => (selection: SelectionNode) =>
  visit(parse(print(query)), setSelectionToQuery(selection))

const queriesByGraphQLVersion = (query: DocumentNode) => {
  const selections: SelectionNode[] = []
  visit(query, selectionsByGraphQLVersion(selections))
  return selections.map(createQueryBySelection(query))
}

const createOperationForQuery = (operation: Operation) => (query: DocumentNode) =>
  createOperation(operation.getContext(), validateOperation(transformOperation({...operation, query} as GraphQLRequest)))

const operationByGraphQLVersion = (operation: Operation) =>
  queriesByGraphQLVersion(operation.query).map(createOperationForQuery(operation))

export const versionSplitterLink = new ApolloLink((operation: Operation, forward?: NextLink) => {
  const operations = operationByGraphQLVersion(operation)

  return forward && new Observable(observer => {
    const datas: any[] = []
    let sent = false

    operations.forEach(op => forward(op).subscribe({
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
  })
})
