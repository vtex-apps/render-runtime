import { Operation } from 'apollo-link'
import { BREAK, DocumentNode, FieldNode, visit } from 'graphql'

const assetsFromQuery = (query: DocumentNode) => {
  const assets = {name: ''}
  visit(query, {
    Field(node: FieldNode, _, __, path) {
      if (path.length === 5) {
        assets.name = node.name.value
        return BREAK
      }
      return undefined
    }
  })
  return assets
}

export const batchKey = (operation: Operation): string => {
  const {uri, fetchOptions: {method}} = operation.getContext()
  const {name} = assetsFromQuery(operation.query as DocumentNode)
  return [uri, method, name].join('_')
}
