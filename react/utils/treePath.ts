const relative = (parent: string, id: string) => id.replace(`${parent}/`, '')

const isDirectChild = (id: string, parent: string) => {
  return id !== parent && (new RegExp(`^${parent}/[a-zA-Z0-9-]+$`)).test(id)
}

export const getDirectChildren = (extensions: Extensions, treePath: string) => {
  return Object.entries(extensions)
    .filter(([id, extension]) => extension.component && isDirectChild(id, treePath))
    .map(([id]) => relative(treePath, id))
    .sort()
}
