import {DocumentNode} from 'graphql'

export const generateHash = (query: DocumentNode) => {
  if (query.documentId) {
    return query.documentId
  }
  return null
}
