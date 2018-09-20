import { ApolloLink, NextLink, Operation } from 'apollo-link'
import { ArgumentNode, BREAK, visit } from 'graphql'

const persistedQueryVersion = (extensions: any) =>
  extensions && extensions.persistedQuery && extensions.persistedQuery.version

export const persistedQueryVersionLink = new ApolloLink((operation: Operation, forward?: NextLink) => {
  const {extensions, query} = operation
  const version = persistedQueryVersion(extensions)
  if (version) {
    let senderApp
    visit(query, {
      Argument(node: ArgumentNode) {
        if (node.name.value === 'sender') {
          senderApp = (node.value as any).value
          return BREAK
        }
      }
    })
    extensions.persistedQuery.version = senderApp || version
  }
  return forward ? forward(operation) : null
})
