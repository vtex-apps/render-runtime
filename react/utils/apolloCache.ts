import { parse } from 'graphql'
import { promised } from './promise'

export interface QueryData {
  data: string
  query: string
  variables: Record<string, any>
}

export const createHydrationFn = (
  queryData: QueryData[] | undefined,
  client: ApolloClientType,
  warningMessage = "Error writing query from render-server in Apollo's cache"
) => {
  return async (isAsync: boolean) => {
    if (!queryData || queryData.length === 0) {
      return
    }

    const hydrationFn = isAsync ? hydrateApolloCacheAsync : hydrateApolloCache
    await hydrationFn(queryData, client, warningMessage)
  }
}

export const hydrateApolloCache = (
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

const hydrateApolloCacheAsync = (
  queryData: QueryData[],
  client: ApolloClientType,
  warningMessage?: string
) => {
  return Promise.all(
    queryData.map(({ data, query, variables }) => {
      return promised((resolve) => {
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
        resolve()
      })
    })
  )
}
