import React, { FC, useReducer, useState, useEffect, useRef } from 'react'
import { canUseDOM } from 'exenv'
import { ApolloLink, NextLink, Observable, Operation } from 'apollo-link'
import { Subscription } from 'apollo-client/util/Observable'
import { getClient } from '../utils/client'

interface State {
  appsEtag: RenderRuntime['appsEtag']
  cacheHints: RenderRuntime['cacheHints']
  components: RenderRuntime['components']
  culture: RenderRuntime['culture']
  defaultExtensions: RenderRuntime['defaultExtensions']
  device: ConfigurationDevice
  extensions: RenderRuntime['extensions']
  messages: RenderRuntime['messages']
  page: RenderRuntime['page']
  pages: RenderRuntime['pages']
  preview: RenderRuntime['preview']
  production: RenderRuntime['production']
  query: RenderRuntime['query']
  settings: RenderRuntime['settings']
  route: RenderRuntime['route']
  loadedPages: Set<string>
  blocksTree?: RenderRuntime['blocksTree']
  blocks?: RenderRuntime['blocks']
  contentMap?: RenderRuntime['contentMap']
}

// const {
//   appsEtag,
//   blocks,
//   blocksTree,
//   cacheHints,
//   contentMap,
//   culture,
//   messages,
//   components,
//   extensions,
//   pages,
//   page,
//   query,
//   production,
//   route,
//   settings,
// } = props.runtime
// const { history, baseURI, cacheControl } = props
// const ignoreCanonicalReplacement = query && query.map

// if (history) {
//   const renderLocation: RenderHistoryLocation = {
//     ...history.location,
//     pathname:
//       ignoreCanonicalReplacement || !route.canonicalPath
//         ? history.location.pathname
//         : route.canonicalPath,
//     state: {
//       navigationRoute: {
//         id: route.id,
//         params: route.params,
//         path: route.path,
//       },
//       renderRouting: true,
//     },
//   }
//   history.replace(renderLocation)
//   // backwards compatibility
//   window.browserHistory = global.browserHistory = history
// }

// // todo: reload window if client-side created a segment different from server-side
// this.sessionPromise = canUseDOM
//   ? window.__RENDER_8_SESSION__.sessionPromise
//   : Promise.resolve()
// const runtimeContextLink = this.createRuntimeContextLink()
// const ensureSessionLink = this.createEnsureSessionLink()
// this.apolloClient = getClient(
//   props.runtime,
//   baseURI,
//   runtimeContextLink,
//   ensureSessionLink,
//   cacheControl
// )

function reducer(state: any, action: any) {}

function initState({ runtime }: any) {
  const {
    appsEtag,
    blocks,
    blocksTree,
    cacheHints,
    contentMap,
    culture,
    messages,
    components,
    extensions,
    pages,
    page,
    query,
    production,
    route,
    settings,
  } = runtime

  return {
    appsEtag,
    blocks,
    blocksTree,
    cacheHints,
    contentMap,
    components,
    culture,
    defaultExtensions: {},
    device: 'any',
    extensions,
    loadedPages: new Set([page]),
    messages,
    page,
    pages,
    preview: false,
    production,
    query,
    route,
    settings,
  }
}

const replaceBrowserHistory = ({ runtime, history }: any) => {
  const { query, route } = runtime
  const ignoreCanonicalReplacement = query && query.map
  if (history) {
    const renderLocation: RenderHistoryLocation = {
      ...history.location,
      pathname:
        ignoreCanonicalReplacement || !route.canonicalPath
          ? history.location.pathname
          : route.canonicalPath,
      state: {
        navigationRoute: {
          id: route.id,
          params: route.params,
          path: route.path,
        },
        renderRouting: true,
      },
    }
    history.replace(renderLocation)
    // backwards compatibility
    window.browserHistory = global.browserHistory = history
  }
  // todo: reload window if client-side created a segment different from server-side
  //   this.sessionPromise = canUseDOM
  //   ? window.__RENDER_8_SESSION__.sessionPromise
  //   : Promise.resolve()
  // const runtimeContextLink = this.createRuntimeContextLink()
  // const ensureSessionLink = this.createEnsureSessionLink()
  // this.apolloClient = getClient(
  //   props.runtime,
  //   baseURI,
  //   runtimeContextLink,
  //   ensureSessionLink,
  //   cacheControl
  // )
}

const createRuntimeContextLink = (state: any) => {
  return new ApolloLink((operation: Operation, forward?: NextLink) => {
    const {
      appsEtag,
      cacheHints,
      components,
      extensions,
      messages,
      pages,
    } = state
    operation.setContext((currentContext: Record<string, any>) => {
      return {
        ...currentContext,
        runtime: {
          appsEtag,
          cacheHints,
          components,
          extensions,
          messages,
          pages,
        },
      }
    })
    return forward ? forward(operation) : null
  })
}

const createEnsureSessionLink = (sessionPromise: Promise<void>) => {
  return new ApolloLink(
    (operation: Operation, forward?: NextLink) =>
      new Observable(observer => {
        let handle: Subscription | undefined
        sessionPromise
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

const RenderProviderFC: FC<any> = props => {
  const { children, runtime, history, baseURI, cacheControl } = props
  const isMountedRef = useRef(false)
  const sessionPromiseRef = useRef<Promise<void>>(Promise.resolve())
  const apolloClientRef = useRef<any>(null)

  const [state, dispatch] = useReducer(reducer, { runtime }, initState)

  if (!isMountedRef.current) {
    replaceBrowserHistory(props)
    sessionPromiseRef.current = canUseDOM
      ? window.__RENDER_8_SESSION__.sessionPromise
      : Promise.resolve()
    const runtimeContextLink = createRuntimeContextLink(state)
    const ensureSessionLink = createEnsureSessionLink(sessionPromiseRef.current)
    apolloClientRef.current = getClient(
      runtime,
      baseURI,
      runtimeContextLink,
      ensureSessionLink,
      cacheControl
    )
  }

  useEffect(() => {
    isMountedRef.current = true
  }, [])
}
