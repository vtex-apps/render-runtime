import {canUseDOM} from 'exenv'
import createHistory from 'history/createBrowserHistory'
import React, {ReactElement} from 'react'
import {hydrate, render as renderDOM} from 'react-dom'
import {Helmet} from 'react-helmet'
import NoSSR from 'react-no-ssr'
import Loading from '../components/Loading'

import ExtensionContainer from '../components/ExtensionContainer'
import ExtensionPoint from '../components/ExtensionPoint'
import LayoutContainer from '../components/LayoutContainer'
import LegacyExtensionContainer from '../components/LegacyExtensionContainer'
import Link from '../components/Link'
import {RenderContext, withRuntimeContext} from '../components/RenderContext'
import RenderProvider from '../components/RenderProvider'
import {getVTEXImgHost} from '../utils/assets'
import PageCacheControl from '../utils/cacheControl'
import {getState} from '../utils/client'
import {buildCacheLocator} from '../utils/client'
import {ensureContainer, getContainer, getMarkups} from '../utils/dom'
import {registerEmitter} from '../utils/events'
import {getBaseURI} from '../utils/host'
import {addLocaleData} from '../utils/locales'
import {withSession} from '../utils/session'
import {TreePathContext} from '../utils/treePath'
import {optimizeSrcForVtexImg, optimizeStyleForVtexImg} from '../utils/vteximg'
import withHMR from '../utils/withHMR'

if (window.IntlPolyfill) {
  if (!window.Intl) {
    window.Intl = window.IntlPolyfill
  } else if (!canUseDOM) {
    window.Intl.NumberFormat = window.IntlPolyfill.NumberFormat
    window.Intl.DateTimeFormat = window.IntlPolyfill.DateTimeFormat
  }
}

function renderToStringWithData(component: ReactElement<any>): Promise<ServerRendered> {
  window.__APOLLO_SSR__ = true
  const startGetDataFromTree = window.hrtime()
  return require('react-apollo').getDataFromTree(component).then(() => {
    const endGetDataFromTree = window.hrtime(startGetDataFromTree)

    window.__APOLLO_SSR__ = false
    const startRenderToString = window.hrtime()
    const markup = require('react-dom/server').renderToString(component)
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
const render = (name: string, runtime: RenderRuntime, element?: HTMLElement): Rendered => {
  const {customRouting, disableSSR, page, pages, extensions, culture: {locale}} = runtime

  const cacheControl = canUseDOM ? undefined : new PageCacheControl()
  const baseURI = getBaseURI(runtime)
  registerEmitter(runtime, baseURI)
  addLocaleData(locale)

  const isPage = !!pages[name] && !!pages[name].path && !!extensions[name].component
  const created = !element && ensureContainer(page)
  const elem = element || getContainer(name)
  const history = canUseDOM && isPage && !customRouting ? createHistory() : null
  const root = (
    <RenderProvider history={history} cacheControl={cacheControl} baseURI={baseURI} root={name} runtime={runtime}>
      {!isPage ? <ExtensionPoint id={name} /> : null}
    </RenderProvider>
  )

  return canUseDOM
    ? (disableSSR || created ? renderDOM(root, elem) : hydrate(root, elem)) as Element
    : renderToStringWithData(root).then(({markup, renderTimeMetric}) => ({
      markups: getMarkups(name, markup),
      maxAge: cacheControl!.maxAge,
      page,
      renderTimeMetric
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

function start() {
  try {
    const runtime = window.__RUNTIME__
    const rootName = runtime.page
    validateRootComponent(rootName, runtime.extensions)

    const ReactCreateElement = React.createElement
    const vtexImgHost = getVTEXImgHost(runtime.account)
    React.createElement = function patchedCreateElement (type: any, props: any) {
      if (type === 'img') {
        props.src = optimizeSrcForVtexImg(vtexImgHost, props.src)
      }
      if (props && props.style) {
        props.style = optimizeStyleForVtexImg(vtexImgHost, props.style)
      }
      return ReactCreateElement.apply(React, arguments)
    }

    const maybeRenderPromise = render(rootName, runtime)
    if (!canUseDOM) {
      // Expose render promise to global context.
      window.rendered = (maybeRenderPromise as Promise<NamedServerRendered>)
        .then(({markups, maxAge, page, renderTimeMetric}) => ({
          extensions: markups.reduce(
            (acc, {name, markup}) => (acc[name] = markup, acc),
            {} as RenderedSuccess['extensions'],
          ),
          head: Helmet.rewind(),
          maxAge,
          renderMetrics: {[page]: renderTimeMetric},
          state: getState(runtime),
        }))
    } else {
      console.log('Welcome to Render! Want to look under the hood? https://careers.vtex.com')
    }
  } catch (error) {
    console.error('Unexpected error rendering:', error)
    if (!canUseDOM) {
      window.rendered = {error}
    }
  }
}

const RenderContextConsumer = RenderContext.Consumer
const TreePathContextConsumer = TreePathContext.Consumer

export {
  ExtensionContainer,
  ExtensionPoint,
  LayoutContainer,
  LegacyExtensionContainer,
  Helmet,
  Link,
  NoSSR,
  RenderContextConsumer,
  TreePathContextConsumer,
  canUseDOM,
  render,
  start,
  withHMR,
  withRuntimeContext,
  withSession,
  Loading,
  buildCacheLocator
}

