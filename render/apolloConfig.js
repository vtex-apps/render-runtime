let customResolvers = {}

export const addCustomResolvers = (resolvers) => {
  customResolvers = {...customResolvers, ...resolvers}
}

export const getCustomResolvers = () => customResolvers

export function getDataIdFromObject ({id, __typename}) {
  return id && __typename ? `${__typename}:${id}` : null
}
