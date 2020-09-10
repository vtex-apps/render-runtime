import { ApolloLink, NextLink, Operation } from 'apollo-link'
import { OperationContext } from './uriSwitchLink'
import { RenderProvider } from '../../../components/RenderProvider'

export function createRuntimeContextLink(initialRuntime: RenderRuntime) {
  let renderProviderInstance: undefined | RenderProvider

  return {
    setRenderProviderInstance: (instance: RenderProvider) => {
      renderProviderInstance = instance
    },
    link: new ApolloLink((operation: Operation, forward?: NextLink) => {
      const {
        appsEtag,
        cacheHints,
        components,
        culture,
        extensions,
        messages,
        pages,
      } = renderProviderInstance?.state ?? initialRuntime

      operation.setContext(
        (currentContext: OperationContext): OperationContext => {
          return {
            ...currentContext,
            runtime: {
              appsEtag,
              cacheHints,
              components,
              culture,
              extensions,
              messages,
              pages,
            },
          }
        }
      )
      return forward ? forward(operation) : null
    }),
  }
}
