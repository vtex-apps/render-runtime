import { ApolloLink, NextLink, Observable, Operation } from 'apollo-link'
import { Subscription } from 'apollo-client/util/Observable'

export const ensureSessionLink = (sessionPromise: Promise<any>) => {
  const sessionRequiredForScope = new Set(['segment', 'private'])

  return new ApolloLink(
    (operation: Operation, forward?: NextLink) =>
      new Observable(observer => {
        let handle: Subscription | undefined

        const { scope } = operation.getContext()
        const promise = sessionRequiredForScope.has(scope)
          ? sessionPromise
          : Promise.resolve()

        const rand = Math.random().toFixed(3)
        const timer = `[${rand}]: ${operation.operationName}: ${scope}`
        console.time(timer)

        promise
          .then(() => {
            console.timeEnd(`[${rand}]: ${operation.operationName}: ${scope}`)

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
