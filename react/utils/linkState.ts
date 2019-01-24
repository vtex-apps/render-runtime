import {
  keys,
  reduce,
  pipe,
  filter,
  endsWith,
  map,
  flip,
  prop,
  uniqBy,
  head,
  split,
} from 'ramda'

type LinkStateDeclaration = {
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
  pipe(
      keys,
      filter(endsWith('LinkState')),
      uniqBy(id => head(split('@', id))),
      map(flip(prop)(GLOBAL_MAP)),
      reduce(mergeReducer, {initialState: {}, resolvers: { Mutation: {} }}),

  )(GLOBAL_MAP)
