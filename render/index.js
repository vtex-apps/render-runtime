import Intl from 'intl'
import {canUseDOM} from 'exenv'
import React from 'react'
import {render as renderToDOM} from 'react-dom'
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

import {Route} from './routes'
import state from './state'
import getClient from './client'
import RenderProvider from './components/RenderProvider'
import Placeholder from './components/Placeholder'

global.Intl = Intl
addLocaleData([...pt, ...en, ...es])

const renderToStringWithData = !canUseDOM && require('react-apollo/lib').renderToStringWithData

const {account, locale, messages, hash, settings, placeholders, route} = state

// Map `placeholder/with/slashes` to `render-placeholder-with-slashes`.
const containerId = name => `render-${name.replace(/\//g, '-')}`

// Whether this placeholder has a component.
const hasComponent = placeholders => name => !!placeholders[name].component

// The placeholder "foo/bar" is root if there is no placeholder "foo" (inside names)
const isRoot = (name, index, names) =>
  names.find(parent => name !== parent && name.startsWith(parent)) === undefined

// Either renders the root component to a DOM element or returns a {name, markup} promise.
const render = (name) => {
  const isPage = !!placeholders[name].path && !!placeholders[name].component
  const id = isPage ? 'render-container' : containerId(name)
  const component = isPage ? <Route /> : <Placeholder id={name} />
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
          hash={hash}
        >
          { component }
        </RenderProvider>
      </ApolloProvider>
    </AppContainer>
  )
  return canUseDOM
    ? renderToDOM(root, document.getElementById(id))
    : renderToStringWithData(root).then(markup => ({name, markup: `<div id="${id}">${markup}</div>`}))
}

export default function (rootName) {
  const childPlaceholders = Object.keys(placeholders)
    .reduce((acc, value) => {
      if (value.startsWith(rootName)) {
        acc[value] = placeholders[value]
      }
      return acc
    }, {})
  // Names of all placeholders with a component
  const withComponentNames = Object.keys(childPlaceholders).filter(hasComponent(childPlaceholders))
  // Names of all top-level placeholders with a component
  const rootWithComponentNames = withComponentNames.filter(isRoot)

  try {
    // If there are multiple renderable placeholders, render them in parallel.
    const renderPromises = rootWithComponentNames.map(name => render(name))
    console.log('Welcome to Render! Want to look under the hood? http://lab.vtex.com/careers/')
    if (!canUseDOM) { // Expose render promises to global context.
      global.rendered = Promise.all(renderPromises).then(results => ({
        head: Helmet.rewind(),
        placeholders: results.reduce((acc, {name, markup}) => (acc[name] = markup) && acc, {}),
        state: getClient().getInitialState(),
      }))
    }
  } catch (error) {
    console.error('Unexpected error rendering:', error)
    if (!canUseDOM) {
      global.rendered = { error }
    }
  }
}
