import {ApolloLink, NextLink, Operation} from 'apollo-link'
import {canUseDOM} from 'exenv'

const isUploadable = (v: any) => v instanceof File || v instanceof Blob || v instanceof FileList

const useHttpLink = (operation: Operation) => {
  const {variables} = operation

  // No file upload is allowed during SSR
  if (!canUseDOM) {
    return true
  }

  let doUseHttpLink = true

  if (variables) {
    Object.values(variables).forEach((v: any) => {
      if (isUploadable(v)) {
        doUseHttpLink = false
      }
    })
  }

  return doUseHttpLink
}

const passthrough = (operation: Operation, forward?: NextLink) => (forward ? forward(operation) : null)

export const createIOFetchLink = (httpLink: ApolloLink, uploadLink: ApolloLink) => new ApolloLink(passthrough).split(
  useHttpLink,
  httpLink,
  uploadLink,
)
