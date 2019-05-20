import {
  ArgumentNode,
  BREAK,
  DocumentNode,
  StringValueNode,
  visit,
} from 'graphql'

interface HashedDocumentNode extends DocumentNode {
  documentId: string
}

const isHashedDocumentNode = (arg: any): arg is HashedDocumentNode => {
  return arg && arg.documentId
}

export const generateHash = (query: HashedDocumentNode | DocumentNode) => {
  if (isHashedDocumentNode(query)) {
    return query.documentId
  }

  const asset = { hash: '' }
  visit(query, {
    Argument(node: ArgumentNode) {
      if (node.name.value === 'hash') {
        asset.hash = (node.value as StringValueNode).value
        return BREAK
      }
    },
  })
  return asset.hash
}
