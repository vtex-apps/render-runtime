type Primitive = string | boolean | number

/**
 * Flattens a deep object, building props separated by a dot.
 */
export const flatObjOnly = (
  obj: Record<string, any>,
  prefix = ''
): Record<string, Primitive> => {
  const flatted: Record<string, string> = {}

  // could use a reduce, but a simple for-in has less footprint
  for (const key in obj) {
    const flatKey = prefix + key
    // we only want plain objects, arrays are kept as they are
    if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
      Object.assign(flatted, flatObjOnly(obj[key], `${flatKey}.`))
    } else {
      flatted[flatKey] = obj[key]
    }
  }

  return flatted
}

/**
 * Traverses an object and apply a transformation function for each of its leaf nodes.
 * The return of the transformation, if different from `undefined`, overwrites the node value.
 */
export const transformLeaves = <T>(
  obj: any,
  transformer: ({ key, value }: { key: string; value: unknown }) => void
): T => {
  if (typeof obj !== 'object') {
    return obj
  }

  const transformed = { ...obj }

  for (const key in transformed) {
    const value = transformed[key]
    if (Array.isArray(value)) {
      transformed[key] = value.map((item: unknown) =>
        transformLeaves(item, transformer)
      )
    } else if (typeof value === 'object') {
      transformed[key] = transformLeaves(value, transformer)
    } else {
      // dealing with a leaf node
      const result = transformer({ key, value: transformed[key] })
      if (typeof result !== 'undefined') {
        transformed[key] = result
      }
    }
  }

  return transformed
}
