import {ApolloLink, NextLink, Operation} from 'apollo-link'

const omitTypename = (key: string, value: any) => (key === '__typename') ? undefined : value

export const omitTypenameLink = new ApolloLink((operation: Operation, forward?:  NextLink) => {
    if (operation.variables) {
      operation.variables = JSON.parse(JSON.stringify(operation.variables), omitTypename)
    }
    return forward ? forward(operation) : null
})
