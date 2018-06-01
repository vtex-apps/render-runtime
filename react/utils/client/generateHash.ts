import {ArgumentNode, BREAK, DocumentNode, visit} from 'graphql'

export const generateHash = (query: DocumentNode) => {
  const asset = {hash: ''}
  visit(query, {
    Argument(node: ArgumentNode) {
      if (node.name.value === 'hash') {
        asset.hash = node.value.value
        return BREAK
      }
    }
  })
  return asset.hash
}
