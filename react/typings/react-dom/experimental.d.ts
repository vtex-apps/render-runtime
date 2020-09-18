import ReactDOM from 'react-dom'

// stripped from: https://github.com/DefinitelyTyped/DefinitelyTyped/blob/7ec01838c4ba1066b3c456492473dcaa44ddf5cd/types/react-dom/experimental.d.ts
declare module 'react-dom' {
  export as namespace ReactDOM

  interface HydrationOptions {
    onHydrated?(suspenseInstance: Comment): void
    onDeleted?(suspenseInstance: Comment): void
  }

  interface RootOptions {
    hydrate?: boolean
    hydrationOptions?: HydrationOptions
  }

  interface Root {
    render(children: React.ReactChild | React.ReactNodeArray): void
    unmount(callback?: () => void): void
  }

  function unstable_createRoot(
    container: Element | Document | DocumentFragment | Comment,
    options?: RootOptions
  ): Root
}
