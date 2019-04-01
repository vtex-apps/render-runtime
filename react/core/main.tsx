import 'apollo-cache-inmemory'
import 'apollo-client'
import 'apollo-link-http'
import 'apollo-link-persisted-queries'
import 'apollo-upload-client'
import 'apollo-utilities'
import 'classnames'
import * as EventEmitter from 'eventemitter3'
import {canUseDOM} from 'exenv'
import 'graphql'
import createHistory from 'history/createBrowserHistory'
import React, {ReactElement} from 'react'
import {getDataFromTree} from 'react-apollo'
import {hydrate, render as renderDOM} from 'react-dom'
import {Helmet} from 'react-helmet'
import NoSSR from 'react-no-ssr'
import Loading from '../components/Loading'

import { ChildBlock, useChildBlock } from '../components/ChildBlock'
import ExtensionContainer from '../components/ExtensionContainer'
import { PortalRenderingRequest } from '../components/ExtensionManager'
import ExtensionPoint from '../components/ExtensionPoint'
import LayoutContainer from '../components/LayoutContainer'
import LegacyExtensionContainer from '../components/LegacyExtensionContainer'
import Link from '../components/Link'
import { RenderContext, useRuntime, withRuntimeContext  } from '../components/RenderContext'
import RenderProvider from '../components/RenderProvider'
import { getVTEXImgHost } from '../utils/assets'
import PageCacheControl from '../utils/cacheControl'
import { getState } from '../utils/client'
import { buildCacheLocator } from '../utils/client'
import { ensureContainer, getContainer, getMarkups } from '../utils/dom'
import { registerEmitter } from '../utils/events'
import { getBaseURI } from '../utils/host'
import { addLocaleData } from '../utils/locales'
import { withSession } from '../utils/session'
import { TreePathContext } from '../utils/treePath'
import { isStyleWritable, optimizeSrcForVtexImg, optimizeStyleForVtexImg } from '../utils/vteximg'
import withHMR from '../utils/withHMR'

let emitter: EventEmitter | null = null

if (window.IntlPolyfill) {
  if (!window.Intl) {
    window.Intl = window.IntlPolyfill
  } else if (!canUseDOM) {
    window.Intl.NumberFormat = window.IntlPolyfill.NumberFormat
    window.Intl.DateTimeFormat = window.IntlPolyfill.DateTimeFormat
  }
}

const renderExtension = (extensionName: string, destination: HTMLElement, props = {}) => {
  if(emitter) {
    emitter.emit('renderExtensionLoader.addOrUpdateExtension', {
      destination,
      extensionName,
      props
    } as PortalRenderingRequest)
  } else {
    throw new Error(`ExtensionPortal can't be rendered before RenderProvider`)
  }
}

function renderToStringWithData(component: ReactElement<any>): Promise<ServerRendered> {
  const startGetDataFromTree = window.hrtime()
  return getDataFromTree(component).then(() => {
    const endGetDataFromTree = window.hrtime(startGetDataFromTree)

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
  const { customRouting, disableSSR, page, pages, extensions, culture: { locale } } = runtime

  const cacheControl = canUseDOM ? undefined : new PageCacheControl()
  const baseURI = getBaseURI(runtime)
  registerEmitter(runtime, baseURI)
  emitter = runtime.emitter
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
    ? (disableSSR || created ? renderDOM<HTMLDivElement>(root, elem) : hydrate(root, elem)) as Element
    : renderToStringWithData(root).then(({ markup, renderTimeMetric }) => ({
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
    React.createElement = function patchedCreateElement(type: any, props: any) {
      if (type === 'a' && props) {
        if (props.target && !props.href) {
          props.target = undefined
        }
        // Follow Google's security recommendations concerning target blank
        // https://developers.google.com/web/tools/lighthouse/audits/noopener
        if (props.target === '_blank' && !(props.rel === 'noopener' || props.rel === 'noreferrer')) {
          props.rel = 'noopener'
        }
      }
      if (type === 'img') {
        props.src = optimizeSrcForVtexImg(vtexImgHost, props.src)
        if (props.src && props.src.startsWith(vtexImgHost)) {
          props.crossOrigin = props.crossOrigin || 'anonymous'
        }
      }
      if (props && props.style && isStyleWritable(props)) {
        props.style = optimizeStyleForVtexImg(vtexImgHost, props.style)
      }
      return ReactCreateElement.apply<typeof React, any, any>(React, arguments)
    }

    const maybeRenderPromise = render(rootName, runtime)
    if (!canUseDOM) {
      // Expose render promise to global context.
      window.rendered = (maybeRenderPromise as Promise<NamedServerRendered>)
        .then(({ markups, maxAge, page, renderTimeMetric }) => ({
          extensions: markups.reduce(
            (acc, { name, markup }) => (acc[name] = markup, acc),
            {} as RenderedSuccess['extensions'],
          ),
          head: Helmet.rewind(),
          maxAge,
          renderMetrics: { [page]: renderTimeMetric },
          state: getState(runtime),
        }))
    } else {
      console.log('Welcome to Render! Want to look under the hood? https://careers.vtex.com')
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
  ChildBlock,
  useChildBlock,
  // These unstable apis should be deprecated shortly
  ChildBlock as Unstable__ChildBlock,
  useChildBlock as useChildBlock__unstable,
  useRuntime,
  withSession,
  Loading,
  buildCacheLocator,
  renderExtension
}

