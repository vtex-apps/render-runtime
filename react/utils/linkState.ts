import {
  endsWith,
  filter,
  flip,
  head,
  keys,
  map,
  pipe,
  prop,
  reduce,
  split,
  uniqBy,
} from 'ramda'

interface LinkStateDeclaration {
  initialState: any
  resolvers: any
}

const mergeReducer = (
  acc: LinkStateDeclaration,
  { initialState, resolvers }: LinkStateDeclaration
) => ({
  initialState: { ...acc.initialState, ...initialState },
  resolvers: { Mutation: { ...acc.resolvers.Mutation, ...resolvers.Mutation }},
})

const GLOBAL_MAP = window.__RENDER_8_COMPONENTS__

export const getGlobalLinkState = () =>
  pipe<ComponentsRegistry, string[], string[], any, any, LinkStateDeclaration>(
      keys,
      filter(endsWith('LinkState')),
      uniqBy((id: string) => head(split('@', id))),
      map(flip(prop)(GLOBAL_MAP)),
      reduce(mergeReducer, {initialState: {}, resolvers: { Mutation: {} }}),
  )(GLOBAL_MAP)
