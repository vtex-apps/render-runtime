import { InMemoryCache } from 'apollo-cache-inmemory'
import { withClientState } from 'apollo-link-state'

 // Probably receive a couples things more here and treat them, since its kindda of this link's job
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
