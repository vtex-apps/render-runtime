import {ArgumentNode, DocumentNode, visit} from 'graphql'

const hashFromQuery = (asset: any) => ({
  Argument(node: ArgumentNode) {
    if (node.name.value === 'hash') {
      asset.hash = node.value.value
    }
  }
})

export const generateHash = (query: DocumentNode) => {
  const asset = {hash: ''}
  visit(query, hashFromQuery(asset))
  return asset.hash
}
