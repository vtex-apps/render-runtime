import { GraphQLError } from 'graphql'

export interface ExtendedGraphQLError extends GraphQLError {
  operationId: string
  extensions: {
    code: string
    exception: {
      stacktrace: string
      name?: string
    }
  }
}

export function isExtendedGraphQLError(
  error: GraphQLError
): error is ExtendedGraphQLError {
  return 'operationId' in error
}

const ignoredErrorTypes = [
  'UserInputError',
  'AuthenticationError',
  'ForbiddenError',
]

class GraphQLErrorsStore {
  private operationIds: string[] = []

  public addOperationIds(errors: readonly GraphQLError[]) {
    const operationIds = errors.reduce<string[]>((acc, error) => {
      if (
        isExtendedGraphQLError(error) &&
        !ignoredErrorTypes.includes(
          (error.extensions.exception && error.extensions.exception.name) || ''
        )
      ) {
        return acc.concat(error.operationId)
      }
      return acc
    }, [])
    this.operationIds = this.operationIds.concat(operationIds)
  }

  public getOperationIds() {
    const operationIds = this.operationIds.slice()
    this.operationIds = []
    return operationIds
  }
}

const Store = new GraphQLErrorsStore()

export default Store
