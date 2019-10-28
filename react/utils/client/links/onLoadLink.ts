import { ApolloLink, NextLink, Operation, Observable } from 'apollo-link'
import { canUseDOM } from 'exenv'
import { Subscription } from 'apollo-client/util/Observable'

let resolveOnLoad: () => void

export const onLoadPromise = new Promise((resolve: any) => {
  if (!canUseDOM) {
    resolve()
  } else {
    resolveOnLoad = resolve
  }
})

if (canUseDOM) {
  window.onload = () => {
    resolveOnLoad()
  }
}

export const waitOnLoadLink = new ApolloLink(
  (operation: Operation, forward?: NextLink) =>
    new Observable(observer => {
      let handle: Subscription | undefined
      onLoadPromise
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
