let customResolvers = {}

export const addCustomResolvers = (resolvers) => {
  customResolvers = {...customResolvers, ...resolvers}
}

export const getCustomResolvers = () => customResolvers

export function getDataIdFromObject (result) {
  const id = (result.slug || result.orderFormId)
  if (result.__typename === 'Facet') {
    return null
  }
  if (id && result.__typename) {
    return result.__typename + ':' + id
  }
  return null
}
