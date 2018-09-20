import {ArgumentNode, BREAK, DocumentNode, visit} from 'graphql'

export const generateHash = (query: DocumentNode) => {
  if ((query as any).documentId) {
    return (query as any).documentId
  }

  const asset = {hash: ''}
  visit(query, {
    Argument(node: ArgumentNode) {
      if (node.name.value === 'hash') {
        asset.hash = (node.value as any).value
        return BREAK
      }
    }
  })
  return asset.hash
}
