import {ApolloLink, createOperation, FetchResult, GraphQLRequest, NextLink, Observable, Operation, RequestHandler} from 'apollo-link'
import {transformOperation, validateOperation} from 'apollo-link/lib/linkUtils'
import {ASTKindToNode, DefinitionNode, DirectiveNode, DocumentNode, FieldNode, GraphQLNonNull, Kind, OperationDefinitionNode, OperationTypeDefinitionNode, parse, print, SelectionNode, SelectionSetNode, VariableDefinitionNode, VariableNode, visit} from 'graphql'

interface Variables {
  [name: string]: VariableDefinitionNode
}

interface Node {
  selection: SelectionNode
  usedVariables: Variables
}

const pickAvailableVariables = (query: DocumentNode) => {
  const availableVariables: Variables = {}
  visit(query, {
    VariableDefinition (node: VariableDefinitionNode) {
      availableVariables[node.variable.name.value] = node
    },
  })
  return availableVariables
}

const isRuntimeMetaDirective = (node: DirectiveNode) => node.name.value === 'runtimeMeta'

const pickUsedVariables = (selection: SelectionNode, availableVariables: Variables) => {
  const usedVariables: Variables = {}
  visit(selection, {
    Variable (varNode: VariableNode) {
      usedVariables[varNode.name.value] = availableVariables[varNode.name.value]
    },
  })
  return usedVariables
}

const pickFields = (query: DocumentNode, availableVariables: Variables) => {
  const nodes: Node[] = []
  visit(query, {
    Field (selection: SelectionNode) {
      if (selection.directives && selection.directives.find(isRuntimeMetaDirective)) {
        nodes.push({
          selection,
          usedVariables: pickUsedVariables(selection, availableVariables),
        })
      }
    },
  })
  return nodes
}

const operationWhiteList = ['query', 'mutation', 'subscription']

const queryFromNodeCreator = (query: DocumentNode) => (node: Node) => visit(parse(print(query)), {
  OperationDefinition (opNode: OperationDefinitionNode) {
    if (operationWhiteList.find((op) => op === opNode.operation)) {
      return {
        ...opNode,
        selectionSet: {
          ...opNode.selectionSet,
          selections: [node.selection],
        },
        variableDefinitions: Object.values(node.usedVariables),
      }
    }
  },
}) as DocumentNode

const assertSingleOperation = (query: DocumentNode) => {
  const ops = query.definitions.filter((def: OperationDefinitionNode) => operationWhiteList.find(op => op === def.operation))

  if (ops.length > 1) {
    throw new Error('Only one operation definition is allowed per query. Please split your queries in two different files')
  }
}

const queriesByRuntimeMetaDirective = (query: DocumentNode) => {
  const availableVariables: Variables = pickAvailableVariables(query)
  const nodes: Node[] = pickFields(query, availableVariables)

  assertSingleOperation(query)

  return nodes.map(queryFromNodeCreator(query))
}

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
  const queries = queriesByRuntimeMetaDirective(operation.query)
  return queries.map(createOperationForQuery(operation))
}

const observableFromOperations = (operations: Operation[], forward: NextLink) => new Observable(observer => {
  const reduced = {}
  let togo = 0

  operations.forEach((op: Operation) => forward(op).subscribe({
    complete: () => {
      if (togo === operations.length) {
        togo++
        observer.next(reduced)
        observer.complete()
      }
    },
    error: (err) => {
      togo++
      observer.error(err)
    },
    next: (data) => {
      togo++
      mergeRecursively(reduced, data)
    },
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
