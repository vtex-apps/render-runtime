// could use a reduce, but a simple for-in has less footprint
export const flatObj = (obj: Record<string, any>, prefix = '') => {
  const flatted: Record<string, string> = {}
  for (const key in obj) {
    const flatKey = prefix + key
    // we want plain objects and arrays
    if (typeof obj[key] === 'object') {
      Object.assign(flatted, flatObj(obj[key], `${flatKey}.`))
    } else {
      flatted[flatKey] = obj[key]
    }
  }
  return flatted
}

export const transformLeaves = <T>(
  obj: any,
  fn: ({ key, value }: { key: string; value: unknown }) => void
): T => {
  if (typeof obj !== 'object') {
    return obj
  }

  const copy = { ...obj }

  for (const key in copy) {
    const value = copy[key]
    if (Array.isArray(value)) {
      copy[key] = value.map((item: unknown) => transformLeaves(item, fn))
    } else if (typeof value === 'object') {
      copy[key] = transformLeaves(copy[key], fn)
    } else {
      const result = fn({ key, value: copy[key] })
      if (typeof result !== 'undefined') {
        copy[key] = result
      }
    }
  }

  return copy
}
