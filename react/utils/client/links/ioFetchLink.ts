import { ApolloLink, NextLink, Operation } from 'apollo-link'
import { canUseDOM } from 'exenv'

const isUploadable = (v: any) =>
  v instanceof File || v instanceof Blob || v instanceof FileList

const usesUpload = (value: any): boolean => {
  if (isUploadable(value)) {
    return true
  }

  // If it isn't an object we can't recurse anymore
  if (Object(value) !== value) {
    return false
  }

  return Object.values(value).some(v => usesUpload(v))
}

const useHttpLink = (operation: Operation) => {
  const { variables } = operation

  // No file upload is allowed during SSR
  if (!canUseDOM) {
    return true
  }

  const doUseHttpLink = !usesUpload(variables)
  return doUseHttpLink
}

const passthrough = (operation: Operation, forward?: NextLink) =>
  forward ? forward(operation) : null

export const createIOFetchLink = (
  httpLink: ApolloLink,
  uploadLink: ApolloLink
) => new ApolloLink(passthrough).split(useHttpLink, httpLink, uploadLink)
