import { ApolloLink, NextLink, Observable, Operation } from 'apollo-link'
import { Subscription } from 'apollo-client/util/Observable'

const sessionRequiredForScope = new Set(['segment', 'private'])

export const ensureSessionLink = (sessionPromise: Promise<any>) => {
  return new ApolloLink(
    (operation: Operation, forward?: NextLink) =>
      new Observable((observer) => {
        let handle: Subscription | undefined

        const { scope } = operation.getContext()
        const promise = sessionRequiredForScope.has(scope)
          ? sessionPromise
          : Promise.resolve()

        promise
          .then(() => {
            handle =
              forward &&
              forward(operation).subscribe({
                complete: observer.complete.bind(observer),
                error: observer.error.bind(observer),
                next: observer.next.bind(observer),
              })
          })
          .catch(observer.error.bind(observer))

        return () => {
          if (handle) {
            handle.unsubscribe()
          }
        }
      })
  )
}
