import Intl from 'intl'
import {canUseDOM} from 'exenv'
import React from 'react'
import {render as renderToDOM} from 'react-dom'
import {AppContainer} from 'react-hot-loader'
import {addLocaleData, IntlProvider} from 'react-intl'
import Helmet from 'react-helmet'
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

const {keys} = Object
const {account, locale, messages} = state

// Map `placeholder/with/slashes` to `render-placeholder-with-slashes`.
const containerId = name => `render-${name.replace(/\//g, '-')}`

// Whether this placeholder has a component.
const hasComponent = placeholders => name => !!placeholders[name].component

// A placeholder "is parent" if no parents to itself exist.
const isParent = (name, index, names) =>
  names.find(parent => name !== parent && name.startsWith(parent)) === undefined

// Either renders the root component to a DOM element or returns a {name, markup} promise.
const render = (placeholders, route, name) => {
  const isPage = !!placeholders[route].component
  const id = isPage ? 'render-container' : containerId(name)
  const component = isPage ? <Route /> : <Placeholder id={name} />
  const root = (
    <AppContainer>
      <ApolloProvider client={getClient()}>
        <IntlProvider locale={locale} messages={messages}>
          <RenderProvider account={account} placeholders={placeholders} route={route}>
            { component }
          </RenderProvider>
        </IntlProvider>
      </ApolloProvider>
    </AppContainer>
  )
  return canUseDOM
    ? renderToDOM(root, document.getElementById(id))
    : renderToStringWithData(root).then(markup => ({name, markup: `<div id="${id}">${markup}</div>`}))
}

export default function (placeholders, route) {
  // Names of all placeholders with a component
  const withComponentNames = keys(placeholders).filter(hasComponent(placeholders))
  // Names of all top-level placeholders with a component
  const parentWithComponentNames = withComponentNames.filter(isParent)

  try {
    // If there are multiple renderable placeholders, render them in parallel.
    const renderPromises = parentWithComponentNames.map(name => render(placeholders, route, name))
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
