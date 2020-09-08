import { parse } from 'graphql'

export interface QueryData {
  data: string
  query: string
  variables: Record<string, any>
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

export const asyncHydrateApolloCache = (
  queryData: QueryData[],
  client: ApolloClientType,
  warningMessage?: string
) => {
  return Promise.all(
    queryData.map(({ data, query, variables }) => {
      return new Promise((resolve) => {
        setTimeout(() => {
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
        }, 1)
      })
    })
  )
}
