import 'apollo-cache-inmemory'
import 'apollo-client'
import 'apollo-link-http'
import 'apollo-link-persisted-queries'
import 'apollo-upload-client'
import 'apollo-utilities'
import 'classnames'
import * as EventEmitter from 'eventemitter3'
import { canUseDOM } from 'exenv'
import 'graphql'
import { createBrowserHistory as createHistory } from 'history'
import queryString from 'query-string'
import React, { ReactElement } from 'react'
import ReactDOM from 'react-dom'
import { getDataFromTree } from 'react-apollo'
import { hydrate, render as renderDOM, Renderer } from 'react-dom'
import { Helmet } from 'react-helmet'
import NoSSR, { useSSR } from '../components/NoSSR'
import { isEmpty } from 'ramda'
import Loading from '../components/Loading'
import {
  MaybeLazyImage,
  LazyImages,
  useLazyImagesContext,
} from '../components/LazyImages'
import { LoadingContextProvider } from '../components/LoadingContext'

import { ChildBlock, useChildBlock } from '../components/ChildBlock'
import ExtensionContainer from '../components/ExtensionPoint/ExtensionContainer'
import ExtensionPoint from '../components/ExtensionPoint'
import LayoutContainer from '../components/LayoutContainer'
import LegacyExtensionContainer from '../components/ExtensionPoint/LegacyExtensionContainer'
import Link from '../components/Link'
import { RenderContext, withRuntimeContext } from '../components/RenderContext'
/** Important: Builder-Hub will only export types of functions imported from individual files.
 * So `useRuntime` should be imported from `../components/useRuntime` rather than
 * being imported along with the other functions from `RenderContext` */
import useRuntime from '../components/useRuntime'
import RenderProvider from '../components/RenderProvider'
import { getVTEXImgHost } from '../utils/assets'
import PageCacheControl from '../utils/cacheControl'
import {
  getState,
  createApolloClient,
  ApolloClientFunctions,
} from '../utils/client'
import { buildCacheLocator } from '../utils/client'
import { ensureContainer, getContainer, getMarkups } from '../utils/dom'
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

let emitter: EventEmitter | null = null

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
  hydrate: boolean,
  root: JSX.Element,
  elem: Element | null
): Promise<Element> => {
  return promised((resolve) => {
    ;(ReactDOM as any)
      .unstable_createRoot(elem, {
        hydrate,
      })
      .render(root)

    resolve((undefined as unknown) as Element)
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
  const { disableSSR, disableSSQ, page } = runtime

  const created = !element && ensureContainer(page)
  const containerElement = element || getContainer()
  const cacheControl = canUseDOM ? undefined : new PageCacheControl()
  const baseURI = getBaseURI(runtime)
  emitter = registerEmitter(runtime, baseURI)

  if (canUseDOM) {
    return promised((resolve) => {
      prepareRootElement(name, runtime, baseURI, cacheControl)
        .then((root) =>
          clientRender(!(disableSSR || created), root, containerElement)
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
    Promise.all([
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

    const runtime = window.__RUNTIME__
    const rootName = runtime.page
    validateRootComponent(rootName, runtime.extensions)

    const ReactCreateElement = React.createElement
    const vtexImgHost = getVTEXImgHost(runtime.account)
    React.createElement = function patchedCreateElement(type: any, props: any) {
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
  ExtensionPoint as Block,
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
