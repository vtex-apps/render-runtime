import {canUseDOM} from 'exenv'
import React from 'react'
import {hydrate, render as renderDOM} from 'react-dom'
import {AppContainer} from 'react-hot-loader'
import {Helmet} from 'react-helmet'
import {ApolloProvider} from 'react-apollo'

import './internal/events'
import {addLocaleData} from './internal/locales'
import {Router} from './components/Router'
import getClient from './internal/client'
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

const {account, culture: {locale}, messages, settings, extensions, pages, page} = global.__RUNTIME__

addLocaleData(locale)

function _renderToStringWithData(component) {
  var startGetDataFromTree = hrtime()
  return require('react-apollo').getDataFromTree(component).then(() => {
    var endGetDataFromTree = hrtime(startGetDataFromTree)

    var startRenderToString = hrtime()
    var markup = require('react-dom/server').renderToString(component)
    var endRenderToString = hrtime(startRenderToString)
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

// Check if this is a client-side-only rendering (used mostly in debug situations)
const ssrEnabled = canUseDOM ? window.location.search.indexOf("__disableSSR") === -1 : true

// Either renders the root component to a DOM element or returns a {name, markup} promise.
const render = name => {
  const isPage = !!pages[name] && !!pages[name].path && !!extensions[name].component
  const id = isPage ? 'render-container' : containerId(name)
  const component = isPage ? <Router /> : <ExtensionPoint id={name} />
  const root = (
    <AppContainer>
      <ApolloProvider client={getClient()}>
        <RenderProvider
          account={account}
          extensions={extensions}
          pages={pages}
          page={page}
          settings={settings}
          locale={locale}
          messages={messages}
        >
          {component}
        </RenderProvider>
      </ApolloProvider>
    </AppContainer>
  )
  return canUseDOM
    ? (ssrEnabled ? hydrate(root, document.getElementById(id)) : renderDOM(root, document.getElementById(id)))
    : renderToStringWithData(root).then(({markup, renderTimeMetric}) => ({
        name,
        renderTimeMetric,
        markup: `<div id="${id}">${markup}</div>`,
      }))
}

function getRenderableExtensionPointNames(rootName) {
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

function start(rootName) {
  const renderableExtensionPointNames = getRenderableExtensionPointNames(rootName)
  try {
    // If there are multiple renderable extensions, render them in parallel.
    const renderPromises = renderableExtensionPointNames.map(render)
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
        state: getClient().cache.extract(),
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
  ExtensionContainer,
  ExtensionPoint,
  Img,
  Link,
}
