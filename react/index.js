import {canUseDOM} from 'exenv'
import createHistory from 'history/createBrowserHistory'
import React from 'react'
import {render as renderDOM} from 'react-dom'
import {AppContainer} from 'react-hot-loader'
import {Helmet} from 'react-helmet'

import {registerEmitter} from './utils/events'
import {addLocaleData} from './utils/locales'
import {getState} from './utils/client'
import RenderProvider from './components/RenderProvider'
import Img from './components/Img'
import Link from './components/Link'
import ExtensionContainer from './ExtensionContainer'
import ExtensionPoint from './ExtensionPoint'

if (global.IntlPolyfill) {
  if (!global.Intl) {
    global.Intl = global.IntlPolyfill
  } else if (!canUseDOM) {
    global.Intl.NumberFormat = global.IntlPolyfill.NumberFormat
    global.Intl.DateTimeFormat = global.IntlPolyfill.DateTimeFormat
  }
}

function _renderToStringWithData(component) {
  var startGetDataFromTree = global.hrtime()
  return require('react-apollo').getDataFromTree(component).then(() => {
    var endGetDataFromTree = global.hrtime(startGetDataFromTree)

    var startRenderToString = global.hrtime()
    var markup = require('react-dom/server').renderToString(component)
    var endRenderToString = global.hrtime(startRenderToString)
    return {
      markup,
      renderTimeMetric: {
        getDataFromTree: endGetDataFromTree,
        renderToString: endRenderToString,
      },
    }
  })
}

const renderToStringWithData =
  !canUseDOM && _renderToStringWithData

// Map `placeholder/with/slashes` to `render-placeholder-with-slashes`.
const containerId = name => `render-${name.replace(/\//g, '-')}`

// Whether this placeholder has a component.
const hasComponent = extensions => name => !!extensions[name].component

// The placeholder "foo/bar" is root if there is no placeholder "foo" (inside names)
const isRoot = (name, index, names) =>
  names.find(parent => name !== parent && name.startsWith(parent)) === undefined

// Either renders the root component to a DOM element or returns a {name, markup} promise.
const render = (name, runtime, element) => {
  const {customRouting, pages, extensions, culture: {locale}} = runtime

  registerEmitter(runtime)
  addLocaleData(locale)

  const isPage = !!pages[name] && !!pages[name].path && !!extensions[name].component
  const id = isPage ? 'render-container' : containerId(name)
  const elem = element || canUseDOM && document.getElementById(id)
  const history = canUseDOM && isPage && !customRouting ? createHistory() : null
  const root = (
    <AppContainer>
      <RenderProvider history={history} root={name} runtime={runtime}>
        {!isPage ? <ExtensionPoint id={name} /> : null}
      </RenderProvider>
    </AppContainer>
  )
  return canUseDOM
    ? renderDOM(root, elem)
    : renderToStringWithData(root).then(({markup, renderTimeMetric}) => ({
      name,
      renderTimeMetric,
      markup: `<div id="${id}">${markup}</div>`,
    }))
}

function getRenderableExtensionPointNames(rootName, extensions) {
  const childExtensionPoints = Object.keys(extensions).reduce((acc, value) => {
    if (value.startsWith(rootName)) {
      acc[value] = extensions[value]
    }
    return acc
  }, {})
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
      global.rendered = Promise.all(renderPromises).then(results => ({
        head: Helmet.rewind(),
        extensions: results.reduce(
          (acc, {name, markup}) => (acc[name] = markup) && acc,
          {},
        ),
        renderMetrics: results.reduce(
          (acc, {name, renderTimeMetric}) => (acc[name] = renderTimeMetric) && acc,
          {},
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

global.__RENDER_6_RUNTIME__ = {
  start,
  render,
  ExtensionContainer,
  ExtensionPoint,
  Img,
  Link,
}
