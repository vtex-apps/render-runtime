import { keys, reduce, pipe, filter, endsWith, map, flip,  prop, uniqBy, head, split} from 'ramda'

 type LinkStateDeclaration = {
    initialState: any,
    reducers: any
}

 const mergeReducer = (acc: LinkStateDeclaration, {initialState, reducers}: LinkStateDeclaration) => ({
    initialState: {...acc.initialState, initialState},
    reducers: {...acc.reducers, reducers}
})

 const GLOBAL_MAP = window.__RENDER_7_COMPONENTS__

 const peak = label => i => {console.log(label, ' ==> ', i)}

 export const getGlobalLinkState = () => 
    pipe(
        keys,
        filter(endsWith('LinkState')),
        peak('Depois do Filter'),
      uniqBy(id => head(split('@', id)),
        map(flip(prop)(GLOBAL_MAP)),
        peak('Depois de mapear'),
        reduce(mergeReducer, {initialState: {}, reducers: {}})
    )(GLOBAL_MAP)
