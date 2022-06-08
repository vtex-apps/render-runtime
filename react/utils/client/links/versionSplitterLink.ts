import {
  ApolloLink,
  createOperation,
  FetchResult,
  GraphQLRequest,
  NextLink,
  Observable,
  Operation,
} from 'apollo-link'
import {
  transformOperation,
  validateOperation,
} from 'apollo-link/lib/linkUtils'
import { BREAK, visit } from 'graphql/language/visitor'
import { print } from 'graphql/language/printer'
import { parse } from 'graphql/language/parser'

interface Variables {
  [name: string]: any
}

interface Node {
  selection: any
  usedVariables: Variables
}

const pickAvailableVariables = (query: any) => {
  const availableVariables: Variables = {}
  visit(query, {
    VariableDefinition(node: any) {
      availableVariables[node.variable.name.value] = node
    },
  })
  return availableVariables
}

const isRuntimeMetaDirective = (node: any) => node.name.value === 'runtimeMeta'

const pickUsedVariables = (selection: any, availableVariables: Variables) => {
  const usedVariables: Variables = {}
  visit(selection, {
    Variable(varNode: any) {
      usedVariables[varNode.name.value] = availableVariables[varNode.name.value]
    },
  })
  return usedVariables
}

const pickFields = (query: any, availableVariables: Variables) => {
  const nodes: Node[] = []
  visit(query, {
    Field(selection: any) {
      if (
        selection.directives &&
        selection.directives.find(isRuntimeMetaDirective)
      ) {
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

const queryFromNodeCreator = (query: any) => (node: Node) =>
  visit(parse(print(query)), {
    OperationDefinition(opNode: any) {
      if (operationWhiteList.includes(opNode.operation)) {
        return {
          ...opNode,
          selectionSet: {
            ...opNode.selectionSet,
            selections: [node.selection],
          },
          variableDefinitions: Object.values(node.usedVariables),
        }
      }

      return null
    },
  }) as any

const isTypeQuery = (docNode: any) => {
  const asset = { isQuery: false }
  visit(docNode, {
    OperationDefinition(node: any) {
      if (node.operation === 'query') {
        asset.isQuery = true
        return BREAK
      }
    },
  })
  return asset.isQuery
}

const assertSingleOperation = (query: any) => {
  const ops = query.definitions.filter((definition: any) =>
    operationWhiteList.includes((definition as any).operation)
  )

  if (ops.length > 1) {
    throw new Error(
      'Only one operation definition is allowed per query. Please split your queries in two different files'
    )
  }
}

const queriesByRuntimeMetaDirective = (query: any) => {
  const availableVariables: Variables = pickAvailableVariables(query)
  const nodes: Node[] = pickFields(query, availableVariables)

  assertSingleOperation(query)

  return nodes.map(queryFromNodeCreator(query))
}

const mergeRecursively = (accumulator: any, value: any) => {
  if (value) {
    Object.keys(value).forEach((key) => {
      if (accumulator[key] && typeof value[key] === 'object') {
        accumulator[key] = mergeRecursively(accumulator[key], value[key])
      } else {
        accumulator[key] = value[key]
      }
    })
  }

  return accumulator
}

const createOperationForQuery = (operation: Operation) => (query: any) => {
  const graphQLRequest: GraphQLRequest = {
    ...operation,
    query,
    extensions: { ...operation.extensions },
  }
  const op = validateOperation(transformOperation(graphQLRequest))
  return createOperation(operation.getContext(), op)
}

const operationByRuntimeMetaDirective = (operation: Operation) => {
  const queries = queriesByRuntimeMetaDirective(operation.query)
  return queries.map(createOperationForQuery(operation))
}

const observableFromOperations = (operations: Operation[], forward: NextLink) =>
  new Observable((observer) => {
    const reduced = {}
    let togo = 0

    operations.forEach((op: Operation) =>
      forward(op).subscribe({
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
      })
    )
  }) as Observable<
    FetchResult<
      { [key: string]: any },
      Record<string, any>,
      Record<string, any>
    >
  >

export const versionSplitterLink = new ApolloLink(
  (operation: Operation, forward?: NextLink): any => {
    if (forward) {
      const query = operation.query
      const operations = operationByRuntimeMetaDirective(operation)

      if (operations.length && isTypeQuery(query)) {
        return observableFromOperations(operations, forward)
      } else {
        return forward(operation)
      }
    }
    return null
  }
)
