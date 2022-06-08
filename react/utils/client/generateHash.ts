import { BREAK, visit } from 'graphql/language/visitor'

interface HashedDocumentNode {
  documentId: string
}

const isHashedDocumentNode = (arg: any): arg is HashedDocumentNode => {
  return arg && arg.documentId
}

export const generateHash = (query: HashedDocumentNode | any) => {
  if (isHashedDocumentNode(query)) {
    return query.documentId
  }

  const asset = { hash: '' }
  visit(query, {
    Argument(node: any) {
      if (node.name.value === 'hash') {
        asset.hash = (node.value as any).value
        return BREAK
      }
    },
  })
  return asset.hash
}
