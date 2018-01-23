import Intl from 'intl'
import {canUseDOM} from 'exenv'
import React from 'react'
import {hydrate, render as renderDOM} from 'react-dom'
import {AppContainer} from 'react-hot-loader'
import {addLocaleData} from 'react-intl'
import {Helmet} from 'react-helmet'
import pt from 'react-intl/locale-data/pt'
import en from 'react-intl/locale-data/en'
import es from 'react-intl/locale-data/es'
import 'intl/locale-data/jsonp/pt.js'
import 'intl/locale-data/jsonp/en.js'
import 'intl/locale-data/jsonp/es.js'
import {ApolloProvider} from 'react-apollo'

import {Router} from './components/Router'
import getClient from './internal/client'
import RenderProvider from './components/RenderProvider'
import ExtensionContainer from './components/ExtensionContainer'
import ExtensionPoint from './components/ExtensionPoint'
import Img from './components/Img'
import Link from './components/Link'

global.Intl = Intl
addLocaleData([...pt, ...en, ...es])

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

const {account, culture: {locale}, messages, settings, placeholders, route} = global.__RUNTIME__

// Map `placeholder/with/slashes` to `render-placeholder-with-slashes`.
const containerId = name => `render-${name.replace(/\//g, '-')}`

// Whether this placeholder has a component.
const hasComponent = placeholders => name => !!placeholders[name].component

// The placeholder "foo/bar" is root if there is no placeholder "foo" (inside names)
const isRoot = (name, index, names) =>
  names.find(parent => name !== parent && name.startsWith(parent)) === undefined

// Check if this is a client-side-only rendering (used mostly in debug situations)
const ssrEnabled = canUseDOM ? window.location.search.indexOf("__disableSSR") === -1 : true

// Either renders the root component to a DOM element or returns a {name, markup} promise.
const render = name => {
  const isPage = !!placeholders[name].path && !!placeholders[name].component
  const id = isPage ? 'render-container' : containerId(name)
  const component = isPage ? <Router /> : <ExtensionPoint id={name} />
  const root = (
    <AppContainer>
      <ApolloProvider client={getClient()}>
        <RenderProvider
          account={account}
          placeholders={placeholders}
          route={route}
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
  const childExtensionPoints = Object.keys(placeholders).reduce((acc, value) => {
    if (value.startsWith(rootName)) {
      acc[value] = placeholders[value]
    }
    return acc
  }, {})
  // Names of all placeholders with a component
  const withComponentNames = Object.keys(childExtensionPoints).filter(
    hasComponent(childExtensionPoints),
  )
  // Names of all top-level placeholders with a component
  const rootWithComponentNames = withComponentNames.filter(isRoot)
  return rootWithComponentNames
}

function start(rootName) {
  const renderableExtensionPointNames = getRenderableExtensionPointNames(rootName)
  try {
    // If there are multiple renderable placeholders, render them in parallel.
    const renderPromises = renderableExtensionPointNames.map(render)
    console.log('Welcome to Render! Want to look under the hood? http://lab.vtex.com/careers/')
    if (!canUseDOM) {
      // Expose render promises to global context.
      global.rendered = Promise.all(renderPromises).then(results => ({
        head: Helmet.rewind(),
        placeholders: results.reduce(
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

global.__VTEX_render_6_runtime__ = {
  start,
  ExtensionContainer,
  ExtensionPoint,
  Img,
  Link,
}
