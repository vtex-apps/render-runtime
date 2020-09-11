import {
  parse,
  DocumentNode,
  visit,
  SelectionSetNode,
  FieldNode,
  BREAK,
} from 'graphql'
import { promised } from './promise'
import { canUseDOM } from 'exenv'
import { path as rpath, values } from 'ramda'
import { dataIdFromObject } from './client'

export interface QueryData {
  data: string
  query: string
  variables: Record<string, any>
}

export const createHydrationFn = (
  client: ApolloClientType,
  warningMessage = "Error writing query from render-server in Apollo's cache"
) => {
  return async (queryData: QueryData[] | undefined) => {
    if (!queryData || queryData.length === 0) {
      return
    }

    const hydrationFn = canUseDOM ? hydrateApolloCacheAsync : hydrateApolloCache
    await hydrationFn(queryData, client, warningMessage)
  }
}

const hydrateApolloCache = (
  queryData: QueryData[],
  client: ApolloClientType,
  warningMessage?: string
) => {
  return queryData.map(({ data, query, variables }) => {
    try {
      client.writeQuery({
        query: parse(query),
        data: JSON.parse(data),
        variables,
      })
    } catch (error) {
      if (warningMessage) {
        console.warn(warningMessage, error)
      }
    }
  })
}

// based on https://github.com/apollographql/apollo-client/blob/v2.6.8/packages/apollo-cache/src/utils.ts
const fragmentFromPojo = (obj: any, typename: string): DocumentNode | null => {
  const selectionSet = selectionSetFromObj(obj)

  if (!selectionSet) {
    return null
  }

  return {
    kind: 'Document',
    definitions: [
      {
        kind: 'FragmentDefinition',
        typeCondition: {
          kind: 'NamedType',
          name: {
            kind: 'Name',
            value: typename,
          },
        },
        name: {
          kind: 'Name',
          value: 'GeneratedClientQuery',
        },
        selectionSet,
      },
    ],
  }
}

// based on https://github.com/apollographql/apollo-client/blob/v2.6.8/packages/apollo-cache/src/utils.ts
const selectionSetFromObj = (obj: any): SelectionSetNode | undefined => {
  const objType = typeof obj
  if (
    objType === 'number' ||
    objType === 'boolean' ||
    objType === 'string' ||
    objType === 'undefined' ||
    obj === null
  ) {
    // No selection set here
    return undefined
  }

  if (Array.isArray(obj)) {
    // GraphQL queries don't include arrays
    return selectionSetFromObj(obj[0])
  }

  // Now we know it's an object
  const selections: FieldNode[] = []

  Object.keys(obj).forEach((key) => {
    const nestedSelSet = selectionSetFromObj(obj[key])

    const field: FieldNode = {
      kind: 'Field',
      name: {
        kind: 'Name',
        value: key,
      },
      selectionSet: nestedSelSet || undefined,
    }

    selections.push(field)
  })

  const selectionSet: SelectionSetNode = {
    kind: 'SelectionSet',
    selections,
  }

  return selectionSet
}

const hasCacheIdAndTypeName = (selectionSet: SelectionSetNode) => {
  const result = selectionSet.selections.reduce(
    (acc, selection) => {
      if (selection.kind !== 'Field') {
        return acc
      }

      if (selection.name.value === '__typename') {
        acc.hasTypeName = true
      } else if (selection.name.value === 'cacheId') {
        acc.hasCacheId = true
      }

      return acc
    },
    { hasTypeName: false, hasCacheId: false }
  )

  return result.hasTypeName && result.hasCacheId
}

const findS = (ast: DocumentNode, data: any) => {
  const dataIn: any = [data]
  const dataPath: string[] = []
  const arrays: Array<string[]> = []

  visit(ast, {
    Field: {
      enter: function (node) {
        const currentData = dataIn[dataIn.length - 1][node.name.value]
        if (currentData == null) {
          return BREAK
        }
        dataPath.push(node.name.value)
        dataIn.push(currentData)
        if (
          node.selectionSet &&
          hasCacheIdAndTypeName(node.selectionSet) &&
          Array.isArray(currentData)
        ) {
          arrays.push(dataPath.slice())
          return BREAK
        }
      },
      leave: function () {
        dataPath.pop()
        dataIn.pop()
      },
    },
  })

  const nextFragments: Array<{
    fragment: DocumentNode
    values: Array<{ dataId: string; data: any }>
  }> = []

  arrays.forEach((dPath) => {
    const ss = rpath(dPath, data) as any[]
    const { cacheId, __typename, ...rest } = ss[0]
    const fragment = fragmentFromPojo(rest, __typename)
    if (!fragment) {
      throw new Error('FUCK!!')
    }
    const goForIt = {
      fragment,
      values: [] as Array<{ dataId: string; data: any }>,
    }

    ss.forEach((sx) => {
      const dataId = dataIdFromObject(sx)!
      const { cacheId, __typename, ...rest } = sx
      Object.keys(rest).forEach((key) => {
        delete sx[key]
        // sx[key] = Array.isArray(sx[key]) ? [] : null
      })
      rest.__typename = __typename
      goForIt.values.push({ dataId, data: rest })
    })

    nextFragments.push(goForIt)
  })

  return nextFragments
}

const hydrateApolloCacheAsync = (
  queryData: QueryData[],
  client: ApolloClientType,
  warningMessage?: string
) => {
  return Promise.all(
    queryData.map(({ data, query, variables }) => {
      return promised((resolve) => {
        const parsedQuery = parse(query, { noLocation: true })
        const parsedData = JSON.parse(data)
        const nextFragments = findS(parsedQuery, parsedData)
        try {
          client.writeQuery({
            query: parsedQuery,
            data: parsedData,
            variables,
          })
        } catch (error) {
          if (warningMessage) {
            console.warn(warningMessage, error)
          }
        }

        if (nextFragments.length > 0) {
          nextFragments.forEach((f) => {
            const v = f.values[0]
            // f.values.forEach((v) => {
            client.writeFragment({
              id: v.dataId,
              data: v.data,
              fragment: f.fragment,
              fragmentName: 'GeneratedClientQuery',
            })
            // })
          })
        }
        resolve()
      })
    })
  )
}
