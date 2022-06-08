import { parse } from 'graphql/language/parser'
import { promised } from './promise'
import { canUseDOM } from 'exenv'
import { ApolloClientType } from '../typings/global'

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

const hydrateApolloCacheAsync = (
  queryData: QueryData[],
  client: ApolloClientType,
  warningMessage?: string
) => {
  return Promise.all(
    queryData.map(({ data, query, variables }) => {
      return promised<void>((resolve) => {
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
