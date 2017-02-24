import Intl from 'intl'
import {canUseDOM} from 'exenv'
import React from 'react'
import ReactDOM from 'react-dom'
import {addLocaleData, IntlProvider} from 'react-intl'
import Helmet from 'react-helmet'
import pt from 'react-intl/locale-data/pt'
import en from 'react-intl/locale-data/en'
import es from 'react-intl/locale-data/es'
import 'intl/locale-data/jsonp/pt.js'
import 'intl/locale-data/jsonp/en.js'
import 'intl/locale-data/jsonp/es.js'
import {ApolloProvider, renderToStringWithData} from 'react-apollo/lib'

import PlaceholderProvider from '../components/PlaceholderProvider'
import {Route} from '../routes'
import state from '../state'
import client from '../client'

let rendered = false
const {account, locale, messages} = state
global.Intl = Intl
addLocaleData([...pt, ...en, ...es])

export default function ({placeholders}) {
  if (rendered) { return false }
  rendered = true

  const Root = () => (
    <ApolloProvider client={client}>
      <IntlProvider locale={locale} messages={messages}>
        <PlaceholderProvider placeholders={placeholders}>
          <Route account={account} />
        </PlaceholderProvider>
      </IntlProvider>
    </ApolloProvider>
  )

  if (canUseDOM) {
    try {
      ReactDOM.render(<Root />, document.getElementById('render-container'))
      console.log('Welcome to Render! Want to look under the hood? http://lab.vtex.com/careers/')
    } catch (e) {
      console.log('Oops!')
      console.error(e)
    }
  } else {
    global.rendered = renderToStringWithData(<Root />).then(markup => ({
      head: Helmet.rewind(),
      markup,
      state: client.getInitialState(),
    }))
  }

  if (canUseDOM && process.env.NODE_ENV !== 'production') {
    global.Perf = require('react-dom/lib/ReactPerf')
  }
}
