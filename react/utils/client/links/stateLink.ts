import { InMemoryCache } from 'apollo-cache-inmemory'
import { withClientState } from 'apollo-link-state'

export const createStateLink = (
  defaults: any,
  resolvers: any,
  cache: InMemoryCache
) =>
  withClientState({
    resolvers,
    cache,
    defaults,
  })