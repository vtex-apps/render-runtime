export const prependRootPath = (rootPath: string, path: string) => {
  return rootPath === '/' ? path : rootPath + path
}

export const appendRootPath = (rootPath: string, host: string) => {
  return rootPath === '/' ? host : host + rootPath
}
