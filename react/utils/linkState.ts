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

const peak = msg => i => {console.log(msg, ' =>>', i); return i}

export const getGlobalLinkState = () =>
  pipe(
      keys,
      filter(endsWith('LinkState')),
      uniqBy(id => head(split('@', id))),
      map(flip(prop)(GLOBAL_MAP)),
      peak('Depois do filter'),
      reduce(mergeReducer, {initialState: {}, resolvers: { Mutation: {} }}),
      peak('Depois do reduce'),

  )(GLOBAL_MAP)
