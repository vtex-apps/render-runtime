import 'apollo-cache-inmemory'
import 'apollo-client'
import 'apollo-link-http'
import 'apollo-link-persisted-queries'
import 'apollo-upload-client'
import 'apollo-utilities'
import 'classnames'
import 'graphql'
import EventEmitter from 'eventemitter3'
import { createBrowserHistory as createHistory } from 'history'
import queryString from 'query-string'
import React, { ReactElement } from 'react'
import { getDataFromTree } from 'react-apollo'
import {
  hydrate as hydrateDOM,
  render as renderDOM,
  unstable_createRoot,
} from 'react-dom'
import Helmet from '../components/Helmet'
import NoSSR, { useSSR } from '../components/NoSSR'
import { isEmpty } from 'ramda'
import Loading from '../components/Loading'
import {
  MaybeLazyImage,
  LazyImages,
  useLazyImagesContext,
} from '../components/LazyImages'
import { LoadingContextProvider } from '../components/LoadingContext'

import ChildBlock from '../components/ChildBlock'
import useChildBlock from '../components/useChildBlock'
import ExtensionContainer from '../components/ExtensionPoint/ExtensionContainer'
import ExtensionPoint from '../components/ExtensionPoint'
import Block from '../components/Block'
import LayoutContainer from '../components/LayoutContainer'
import LegacyExtensionContainer from '../components/ExtensionPoint/LegacyExtensionContainer'
import Link from '../components/Link'
import RenderContext from '../components/RenderContext'
/** Important: Builder-Hub will only export types of functions imported from individual files.
 * So `useRuntime` should be imported from `../components/useRuntime`
 * and `withRuntimeContext` from `../components/withRuntimeContext` rather than being imported
 * along with the other functions from `RenderContext` */
import useRuntime from '../components/useRuntime'
import withRuntimeContext from '../components/withRuntimeContext'
import canUseDOM from '../components/canUseDOM'
import RenderProvider from '../components/RenderProvider'
import { getVTEXImgHost } from '../utils/assets'
import PageCacheControl from '../utils/cacheControl'
import {
  getState,
  createApolloClient,
  ApolloClientFunctions,
} from '../utils/client'
import { buildCacheLocator } from '../utils/client'
import { getMarkups, getOrCreateContainer } from '../utils/dom'
import { registerEmitter } from '../utils/events'
import { getBaseURI } from '../utils/host'
import registerComponent from '../utils/registerComponent'
import { withSession } from '../utils/session'
import { TreePathContext, useTreePath } from '../utils/treePath'
import {
  isStyleWritable,
  optimizeSrcForVtexImg,
  optimizeStyleForVtexImg,
} from '../utils/vteximg'
import withHMR from '../utils/withHMR'
import { generateExtensions } from '../utils/blocks'
import { promised } from '../utils/promise'
import {
  RenderedSuccess,
  NamedServerRendered,
  Rendered,
  ServerRendered,
} from '../typings/global'
import { RenderRuntime, Extensions } from '../typings/runtime'
// We need to keep this import so the types of this modules are kept in the final bundle by the Builder Hub.
import '../typings/runtime'

let emitter: EventEmitter | null = null
const cssClasses = new Set<string>()

const renderExtension = (
  extensionName: string,
  destination: HTMLElement,
  props = {}
) => {
  if (emitter) {
    emitter.emit('renderExtensionLoader.addOrUpdateExtension', {
      destination,
      extensionName,
      props,
    })
  } else {
    throw new Error(`ExtensionPortal can't be rendered before RenderProvider`)
  }
}

function renderToStringWithData(
  component: ReactElement<any>,
  renderFn: (root: ReactElement) => string,
  skipQuery = false
): Promise<ServerRendered> {
  const getDataFn = (): Promise<string | void> => {
    if (skipQuery) return Promise.resolve()
    return getDataFromTree(component)
  }

  const startGetDataFromTree = window.hrtime()
  return getDataFn().then(() => {
    const endGetDataFromTree = window.hrtime(startGetDataFromTree)

    const startRenderToString = window.hrtime()
    const markup = renderFn(component)
    const endRenderToString = window.hrtime(startRenderToString)
    return {
      markup,
      renderTimeMetric: {
        getDataFromTree: endGetDataFromTree,
        renderToString: endRenderToString,
      },
    }
  })
}

const clientRender = (
  root: JSX.Element,
  elem: Element,
  hydrate: boolean,
  concurrent?: boolean
): Promise<void> => {
  return promised((resolve) => {
    if (concurrent) {
      unstable_createRoot(elem, { hydrate }).render(root)
      resolve()
    } else if (hydrate) {
      hydrateDOM(root, elem, resolve)
    } else {
      renderDOM(root, elem, resolve)
    }
  })
}

const createRootElement = (
  name: string,
  runtime: RenderRuntime,
  sessionPromise: Promise<void>,
  apollo: ApolloClientFunctions
) => {
  const { customRouting, pages, extensions } = runtime
  const isPage =
    !!pages[name] && !!pages[name].path && !!extensions[name]?.component
  const history = canUseDOM && isPage && !customRouting ? createHistory() : null

  return (
    <RenderProvider
      apollo={apollo}
      history={history}
      root={name}
      runtime={runtime}
      sessionPromise={sessionPromise}
    >
      {!isPage ? <ExtensionPoint id={name} /> : null}
    </RenderProvider>
  )
}

const prepareRootElement = (
  name: string,
  runtime: RenderRuntime,
  baseURI: string,
  cacheControl: PageCacheControl | undefined
) => {
  const sessionPromise = canUseDOM
    ? window.__RENDER_8_SESSION__.sessionPromise
    : Promise.resolve()

  return createApolloClient(
    runtime,
    baseURI,
    sessionPromise,
    cacheControl
  ).then((apollo) =>
    apollo
      .hydrate(runtime.queryData)
      .then(() => createRootElement(name, runtime, sessionPromise, apollo))
  )
}

// Either renders the root component to a DOM element or returns a {name, markup} promise.
const render = async (
  name: string,
  runtime: RenderRuntime,
  element?: HTMLElement
): Rendered => {
  const { concurrentMode, disableSSR, disableSSQ, page } = runtime

  const cacheControl = canUseDOM ? undefined : new PageCacheControl()
  const baseURI = getBaseURI(runtime)
  emitter = registerEmitter(runtime, baseURI)

  if (canUseDOM) {
    const { container, created } = element
      ? { container: element, created: false }
      : getOrCreateContainer()
    const shouldHydrate = !(disableSSR || created)
    return promised<void>((resolve) => {
      prepareRootElement(name, runtime, baseURI, cacheControl)
        .then((root) =>
          clientRender(root, container, shouldHydrate, concurrentMode)
        )
        .then(resolve)
    })
  }

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { renderToStaticMarkup, renderToString } = require('react-dom/server')

  const commonRenderResult = {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    maxAge: cacheControl!.maxAge,
    page,
  }

  if (runtime.amp) {
    return Promise.all([
      prepareRootElement(name, runtime, baseURI, cacheControl),
      import(
        /* webpackMode: "weak" */
        '../AMP'
      ),
    ]).then(([root, { setupAMP }]) => {
      const { ampRoot, getExtraRenderedData } = setupAMP(
        root,
        renderToStaticMarkup,
        runtime
      )
      return renderToStringWithData(
        ampRoot,
        renderToStaticMarkup,
        disableSSQ
      ).then(({ markup, renderTimeMetric }) => ({
        ...commonRenderResult,
        markups: getMarkups(name, markup),
        renderTimeMetric,
        ...getExtraRenderedData(),
      }))
    })
  }

  return prepareRootElement(name, runtime, baseURI, cacheControl).then((root) =>
    renderToStringWithData(root, renderToString, disableSSQ).then(
      ({ markup, renderTimeMetric }) => ({
        ...commonRenderResult,
        markups: getMarkups(name, markup),
        renderTimeMetric,
      })
    )
  )
}

function validateRootComponent(rootName: string, extensions: Extensions) {
  if (!extensions[rootName]) {
    throw new Error(`Missing extension point for page ${rootName}`)
  }

  if (!extensions[rootName]?.component) {
    throw new Error(`Missing component for extension point ${rootName}`)
  }
}

function setLazyCookie(setCookie: string) {
  if (setCookie) {
    document.cookie = setCookie
  }
}

function start() {
  try {
    if (
      window.__RUNTIME__.blocksTree &&
      !isEmpty(window.__RUNTIME__.blocksTree)
    ) {
      window.__RUNTIME__.hasNewExtensions = true
      window.__RUNTIME__.extensions = generateExtensions(
        window.__RUNTIME__.blocksTree,
        // eslint-disable-next-line
        window.__RUNTIME__.blocks!,
        // eslint-disable-next-line
        window.__RUNTIME__.contentMap!,
        window.__RUNTIME__.pages[window.__RUNTIME__.page]
      )
    }

    if (canUseDOM) {
      const browserQuery = window.location.search
        ? queryString.parse(window.location.search)
        : {}
      const serverQuery = window.__RUNTIME__.serverQuery ?? {}
      window.__RUNTIME__.query = { ...serverQuery, ...browserQuery }
    }

    const runtime: RenderRuntime = window.__RUNTIME__
    runtime.isJanusProxied =
      canUseDOM && window.location.pathname.startsWith('/api/io/')
    const rootName = runtime.page
    validateRootComponent(rootName, runtime.extensions)

    const ReactCreateElement = React.createElement
    const vtexImgHost = getVTEXImgHost(runtime.account)
    React.createElement = function patchedCreateElement(type: any, props: any) {
      if (
        !canUseDOM &&
        typeof type === 'string' &&
        type[0].toLowerCase() === type[0] &&
        props &&
        props.className
      ) {
        const classnames: string[] = props.className.trim().split(/\s+/)
        classnames.forEach((classname) => cssClasses.add(classname))
      }

      if (type === 'a' && props) {
        if (props.target && !props.href) {
          props.target = undefined
        }
        // Follow Google's security recommendations concerning target blank
        // https://developers.google.com/web/tools/lighthouse/audits/noopener
        const rel = props.rel ? props.rel.split(' ') : []
        if (
          props.target === '_blank' &&
          !(rel.indexOf('noopener') !== -1 || rel.indexOf('noreferrer') !== -1)
        ) {
          props.rel = rel.concat('noopener').join(' ')
        }
      }

      if (type === 'img') {
        props.src = optimizeSrcForVtexImg(vtexImgHost, props.src)
        if (
          typeof props.src === 'string' &&
          props.src.startsWith(vtexImgHost)
        ) {
          props.crossOrigin = props.crossOrigin || 'anonymous'
        }
        return ReactCreateElement.apply(React, [
          MaybeLazyImage,
          {
            createElement: ReactCreateElement,
            imageProps: props,
          },
        ])
      }

      if (props && props.style && isStyleWritable(props)) {
        props.style = optimizeStyleForVtexImg(vtexImgHost, props.style)
      }
      // This rule was introduced in a eslint-config update.
      // Should be fixed in a future PR
      //eslint-disable-next-line prefer-rest-params
      return ReactCreateElement.apply(React, arguments)
    }

    const maybeRenderPromise = render(rootName, runtime)
    if (!canUseDOM) {
      // Expose render promise to global context.
      window.rendered = (maybeRenderPromise as Promise<
        NamedServerRendered
      >).then(({ markups, maxAge, page, renderTimeMetric, ...rendered }) => ({
        cssClasses: Array.from(cssClasses).sort(),
        extensions: markups.reduce<RenderedSuccess['extensions']>(
          (acc, { name, markup }) => ((acc[name] = markup), acc),
          {}
        ),
        head: Helmet.rewind(),
        maxAge,
        renderMetrics: { [page]: renderTimeMetric },
        state: getState(runtime),
        ...rendered,
      }))
    } else {
      setLazyCookie(runtime.workspaceCookie)
      maybeRenderPromise
        .then(() => {
          ;(window as any).__HAS_HYDRATED__ = true
        })
        .catch((error) => {
          console.error('Error during hydration', error)
        })
      console.log(
        'Welcome to Render! Want to look under the hood? https://careers.vtex.com'
      )
    }
  } catch (error) {
    console.error('Unexpected error rendering:', error)
    if (!canUseDOM) {
      window.rendered = { error }
    }
  }
}

const RenderContextConsumer = RenderContext.Consumer
const TreePathContextConsumer = TreePathContext.Consumer

export {
  ExtensionContainer,
  /** Block is the preferred nomenclature now, ExtensionPoint is kept for
   * backwards compatibility
   */
  Block,
  ExtensionPoint,
  LayoutContainer,
  LegacyExtensionContainer,
  Helmet,
  Link,
  NoSSR,
  useSSR,
  RenderContextConsumer,
  TreePathContextConsumer,
  LazyImages as ExperimentalLazyImages,
  useLazyImagesContext as useExperimentalLazyImagesContext,
  canUseDOM,
  render,
  start,
  withHMR,
  registerComponent,
  withRuntimeContext,
  ChildBlock,
  useChildBlock,
  useRuntime,
  useTreePath,
  withSession,
  Loading,
  LoadingContextProvider,
  buildCacheLocator,
  renderExtension,
  // These unstable APIs should be deprecated shortly
  ChildBlock as Unstable__ChildBlock,
  useChildBlock as useChildBlock__unstable,
}
