import { canUseDOM } from 'exenv'

interface Resolver<T> {
  (resolve: (value: T) => void): void
}
export const promised = <T = void>(resolver: Resolver<T>) => {
  return new Promise<T>((resolve) => {
    if (!canUseDOM) {
      resolver(resolve)
    } else {
      setTimeout(() => resolver(resolve), 1)
    }
  })
}
