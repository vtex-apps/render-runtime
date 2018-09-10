import { Operation } from 'apollo-link'
import { BREAK, DocumentNode, FieldNode, visit } from 'graphql'

// GraphQL's AST is made in such a way that the root fields are
// in depth equals 5 when visiting it.
const ROOT_FIELD_DEPTH = 5

const assetsFromQuery = (query: DocumentNode) => {
  const assets = {name: ''}
  visit(query, {
    Field(node: FieldNode, _, __, path) {
      if (path.length === ROOT_FIELD_DEPTH) {
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
