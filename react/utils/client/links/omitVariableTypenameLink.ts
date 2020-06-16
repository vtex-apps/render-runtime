import { ApolloLink, NextLink, Operation } from 'apollo-link'
import { canUseDOM } from 'exenv'

const deepCopyFiles = (src: any, dst: any) =>
  src &&
  typeof src === 'object' &&
  Object.keys(src).forEach((key) => {
    if (
      src[key] instanceof File ||
      src[key] instanceof Blob ||
      src[key] instanceof FileList
    ) {
      dst[key] = src[key]
    } else {
      deepCopyFiles(src[key], dst[key])
    }
  })

const omitTypename = (key: string, value: any) =>
  key === '__typename' ? undefined : value

export const omitTypenameLink = new ApolloLink(
  (operation: Operation, forward?: NextLink) => {
    const { variables } = operation
    if (variables && canUseDOM) {
      operation.variables = JSON.parse(
        JSON.stringify(operation.variables),
        omitTypename
      )
      deepCopyFiles(variables, operation.variables)
    }
    return forward ? forward(operation) : null
  }
)
