import { ApolloLink, NextLink, Operation } from 'apollo-link'
import { canUseDOM } from 'exenv'

import { visit } from 'graphql/language/visitor'

import { generateHash } from '../generateHash'
import { appendLocationSearch } from '../../location'
import type { RenderRuntime, CacheHints } from '../../../typings/runtime'
import type {
  ASTNode,
  DirectiveNode,
  OperationDefinitionNode,
  StringValueNode,
} from 'graphql/language/ast'

interface Assets {
  operationType: string
  queryScope?: string
}

const assetsFromQuery = (query: ASTNode) => {
  const assets: Assets = { operationType: 'mutation' }
  visit(query, {
    Directive(node: DirectiveNode) {
      if (node.name.value === 'context') {
        const scopeArg =
          node.arguments &&
          node.arguments.find(
            (argNode: { name: { value: string } }) =>
              argNode.name.value === 'scope'
          )
        if (scopeArg) {
          assets.queryScope = (scopeArg.value as StringValueNode).value
        }
      }
    },
    OperationDefinition(node: OperationDefinitionNode) {
      assets.operationType = node.operation
    },
  })
  return assets
}

export interface OperationContext {
  fetchOptions: any
  runtime: Pick<
    RenderRuntime,
    | 'appsEtag'
    | 'cacheHints'
    | 'components'
    | 'culture'
    | 'extensions'
    | 'messages'
    | 'pages'
  >
}

const extractHints = (query: ASTNode, meta: CacheHints) => {
  const { operationType, queryScope } = assetsFromQuery(query)

  let hints
  if (operationType?.toLowerCase() === 'query') {
    hints = meta ? meta : { scope: queryScope }
  } else {
    hints = { ...meta, scope: 'private' }
  }

  const {
    maxAge = 'long',
    scope = 'private',
    version = 1,
    provider,
    sender,
  } = hints
  return {
    maxAge: maxAge.toLowerCase(),
    operationType,
    scope: scope.toLowerCase(),
    version,
    provider,
    sender,
  }
}

export const createUriSwitchLink = (
  baseURI: string,
  initialRuntime: RenderRuntime
) =>
  new ApolloLink((operation: Operation, forward?: NextLink) => {
    operation.setContext((oldContext: OperationContext) => {
      const {
        fetchOptions = {},
        // Fetches from context for not fetching a stale version of runtime
        runtime: {
          appsEtag,
          cacheHints,
          culture: { locale },
        },
      } = oldContext
      const { extensions } = operation
      const {
        binding,
        workspace,
        route: { domain },
        production,
      } = initialRuntime
      const hash = generateHash(operation.query)

      if (!production && !hash) {
        throw new Error(
          'Could not generate hash from query. Are you using graphql-tag ? Split your graphql queries in .graphql files and import them instead'
        )
      }

      const includeQuery = (oldContext as any).http?.includeQuery || !hash
      const { maxAge, scope, version, provider, sender } = extractHints(
        operation.query,
        cacheHints[hash]
      )

      const requiresAuthorization =
        initialRuntime.settings?.[`vtex.${domain}`]?.requiresAuthorization

      const isPrivateChannel = initialRuntime.channelPrivacy === 'private'

      const customScope =
        requiresAuthorization || isPrivateChannel ? 'private' : scope
      const oldMethod = includeQuery ? 'POST' : fetchOptions.method || 'POST'
      const protocol = canUseDOM ? 'https:' : 'http:'
      const method =
        customScope?.toLowerCase() === 'private' ? 'POST' : oldMethod
      extensions.persistedQuery = {
        ...extensions.persistedQuery,
        sender,
        provider,
      }

      let query = `?workspace=${workspace}&maxAge=${maxAge}&appsEtag=${appsEtag}&domain=${domain}&locale=${locale}`
      if (binding && binding.id) {
        query = appendLocationSearch(query, { __bindingId: binding.id })
      }

      return {
        ...oldContext,
        http: {
          ...(oldContext as any).http,
          includeQuery,
        },
        scope: customScope,
        fetchOptions: { ...fetchOptions, method },
        uri: `${protocol}//${baseURI}/_v/${customScope}/graphql/v${version}${query}`,
      }
    })
    return forward ? forward(operation) : null
  })
