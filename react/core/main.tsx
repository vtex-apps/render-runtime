import {canUseDOM} from 'exenv'
import createHistory from 'history/createBrowserHistory'
import React, {ReactElement} from 'react'
import {hydrate, render as renderDOM} from 'react-dom'
import {Helmet} from 'react-helmet'
import NoSSR from 'react-no-ssr'

import Link from '../components/Link'
import RenderProvider from '../components/RenderProvider'
import ExtensionContainer from '../ExtensionContainer'
import ExtensionPoint from '../ExtensionPoint'
import PageCacheControl from '../utils/cacheControl'
import {getState} from '../utils/client'
import {ensureContainer, getContainer, getMarkups} from '../utils/dom'
import {registerEmitter} from '../utils/events'
import {getBaseURI} from '../utils/host'
import {addLocaleData} from '../utils/locales'
import withHMR from '../utils/withHMR'

if (global.IntlPolyfill) {
  if (!global.Intl) {
    global.Intl = global.IntlPolyfill
  } else if (!canUseDOM) {
    global.Intl.NumberFormat = global.IntlPolyfill.NumberFormat
    global.Intl.DateTimeFormat = global.IntlPolyfill.DateTimeFormat
  }
}

function renderToStringWithData(component: ReactElement<any>): Promise<ServerRendered> {
  const startGetDataFromTree = global.hrtime()
  return require('react-apollo').getDataFromTree(component).then(() => {
    const endGetDataFromTree = global.hrtime(startGetDataFromTree)

    const startRenderToString = global.hrtime()
    const markup = require('react-dom/server').renderToString(component)
    const endRenderToString = global.hrtime(startRenderToString)
    return {
      markup,
      renderTimeMetric: {
        getDataFromTree: endGetDataFromTree,
        renderToString: endRenderToString,
      },
    }
  })
}

// Whether this placeholder has a component.
const hasComponent = (extensions: Extensions) => (name: string) => !!extensions[name].component

// The placeholder "foo/bar" is root if there is no placeholder "foo" (inside names)
const isRoot = (name: string, index: number, names: string[]) =>
  names.find(parent => name !== parent && name.startsWith(parent)) === undefined

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

function getRenderableExtensionPointNames(rootName: string, extensions: Extensions) {
  const childExtensionPoints = Object.keys(extensions).reduce((acc, value) => {
    if (value.startsWith(rootName)) {
      acc[value] = extensions[value]
    }
    return acc
  }, {} as Extensions)
  // Names of all extensions with a component
  const withComponentNames = Object.keys(childExtensionPoints).filter(
    hasComponent(childExtensionPoints),
  )
  // Names of all top-level extensions with a component
  const rootWithComponentNames = withComponentNames.filter(isRoot)
  return rootWithComponentNames
}

function start() {
  const runtime = global.__RUNTIME__
  const renderableExtensionPointNames = getRenderableExtensionPointNames(runtime.page, runtime.extensions)

  try {
    // If there are multiple renderable extensions, render them in parallel.
    const renderPromises = renderableExtensionPointNames.map(e => render(e, runtime))
    console.log('Welcome to Render! Want to look under the hood? http://lab.vtex.com/careers/')
    if (!canUseDOM) {
      // Expose render promises to global context.
      global.rendered = Promise.all(renderPromises as Array<Promise<NamedServerRendered>>).then(results => ({
        extensions: results.reduce(
          (acc, {markups}) => (markups.forEach(({name, markup}) => acc[name] = markup), acc),
          {} as RenderedSuccess['extensions'],
        ),
        head: Helmet.rewind(),
        maxAge: Math.min(...results.map(({maxAge}) => maxAge)),
        renderMetrics: results.reduce(
          (acc, {page, renderTimeMetric}) => (acc[page] = renderTimeMetric, acc),
          {} as RenderedSuccess['renderMetrics'],
        ),
        state: getState(runtime),
      }))
    }
  } catch (error) {
    console.error('Unexpected error rendering:', error)
    if (!canUseDOM) {
      global.rendered = {error}
    }
  }
}

export {
  ExtensionContainer,
  ExtensionPoint,
  Helmet,
  Link,
  NoSSR,
  canUseDOM,
  render,
  start,
  withHMR,
}

