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
import React, { ReactElement } from 'react'
import { getDataFromTree } from 'react-apollo'
import { hydrate, render as renderDOM } from 'react-dom'
import { Helmet } from 'react-helmet'
import NoSSR, { useSSR } from '../components/NoSSR'
import { isEmpty } from 'ramda'
import Loading from '../components/Loading'

import { ChildBlock, useChildBlock } from '../components/ChildBlock'
import ExtensionContainer from '../components/ExtensionContainer'
import ExtensionPoint from '../components/ExtensionPoint'
import LayoutContainer from '../components/LayoutContainer'
import LegacyExtensionContainer from '../components/LegacyExtensionContainer'
import Link from '../components/Link'
import {
  RenderContext,
  useRuntime,
  withRuntimeContext,
} from '../components/RenderContext'
import RenderProvider from '../components/RenderProvider'
import { getVTEXImgHost } from '../utils/assets'
import PageCacheControl from '../utils/cacheControl'
import { getState } from '../utils/client'
import { buildCacheLocator } from '../utils/client'
import { ensureContainer, getContainer, getMarkups } from '../utils/dom'
import { registerEmitter } from '../utils/events'
import { getBaseURI } from '../utils/host'
import { addLocaleData } from '../utils/locales'
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

let emitter: EventEmitter | null = null

if (window.IntlPolyfill) {
  if (!window.Intl) {
    window.Intl = window.IntlPolyfill
  } else if (!canUseDOM) {
    window.Intl.NumberFormat = window.IntlPolyfill.NumberFormat
    window.Intl.DateTimeFormat = window.IntlPolyfill.DateTimeFormat
  }
}

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
  renderFn: (root: ReactElement) => string
): Promise<ServerRendered> {
  const startGetDataFromTree = window.hrtime()
  return getDataFromTree(component).then(() => {
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

// Either renders the root component to a DOM element or returns a {name, markup} promise.
const render = async (
  name: string,
  runtime: RenderRuntime,
  element?: HTMLElement
): Rendered => {
  const {
    customRouting,
    disableSSR,
    page,
    pages,
    extensions,
    culture: { locale },
  } = runtime

  const cacheControl = canUseDOM ? undefined : new PageCacheControl()
  const baseURI = getBaseURI(runtime)
  registerEmitter(runtime, baseURI)
  emitter = runtime.emitter
  addLocaleData(locale)

  const isPage =
    !!pages[name] && !!pages[name].path && !!extensions[name].component
  const created = !element && ensureContainer(page)
  const elem = element || getContainer()
  const history = canUseDOM && isPage && !customRouting ? createHistory() : null
  const root = (
    <RenderProvider
      history={history}
      cacheControl={cacheControl}
      baseURI={baseURI}
      root={name}
      runtime={runtime}
    >
      {!isPage ? <ExtensionPoint id={name} /> : null}
    </RenderProvider>
  )

  if (canUseDOM) {
    const renderFn = disableSSR || created ? renderDOM : hydrate

    return (renderFn(root, elem) as unknown) as Element
  }

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { renderToStaticMarkup, renderToString } = require('react-dom/server')

  const commonRenderResult = {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    maxAge: cacheControl!.maxAge,
    page,
  }

  if (runtime.amp) {
    const {
      AmpScriptsManager,
      AmpScripts,
      headerBoilerplate,
    } = require('react-amphtml/setup') // eslint-disable-line @typescript-eslint/no-var-requires
    const scripts = new AmpScripts()

    const ampRoot = (
      <AmpScriptsManager ampScripts={scripts}>{root}</AmpScriptsManager>
    )

    return renderToStringWithData(ampRoot, renderToStaticMarkup).then(
      ({ markup, renderTimeMetric }) => {
        const scriptsMarkup = renderToStaticMarkup(scripts.getScriptElements())
        const boilerplateMarkup = renderToStaticMarkup(
          headerBoilerplate(runtime.route.canonicalPath)
        )

        return {
          ...commonRenderResult,
          markups: getMarkups(name, markup),
          renderTimeMetric,
          ampScripts: scriptsMarkup,
          ampHeaderBoilerplate: boilerplateMarkup,
        }
      }
    )
  }

  return renderToStringWithData(root, renderToString).then(
    ({ markup, renderTimeMetric }) => ({
      ...commonRenderResult,
      markups: getMarkups(name, markup),
      renderTimeMetric,
    })
  )
}

function validateRootComponent(rootName: string, extensions: Extensions) {
  if (!extensions[rootName]) {
    throw new Error(`Missing extension point for page ${rootName}`)
  }

  if (!extensions[rootName].component) {
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
      }

      if (props && props.style && isStyleWritable(props)) {
        props.style = optimizeStyleForVtexImg(vtexImgHost, props.style)
      }

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
  buildCacheLocator,
  renderExtension,
  // These unstable APIs should be deprecated shortly
  ChildBlock as Unstable__ChildBlock,
  useChildBlock as useChildBlock__unstable,
}
