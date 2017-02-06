import Intl from 'intl'
import {canUseDOM} from 'exenv'
import React, {PropTypes} from 'react'
import ReactDOM from 'react-dom'
import {addLocaleData, IntlProvider} from 'react-intl'
import pt from 'react-intl/locale-data/pt'
import en from 'react-intl/locale-data/en'
import es from 'react-intl/locale-data/es'
import 'intl/locale-data/jsonp/pt.js'
import 'intl/locale-data/jsonp/en.js'
import 'intl/locale-data/jsonp/es.js'
import Helmet from 'react-helmet'
import {ApolloProvider, renderToStringWithData} from 'react-apollo/lib'

import './routes'
import state from './state'
import Placeholder from './components/Placeholder'

global.Intl = Intl
addLocaleData([...pt, ...en, ...es])

const Root = ({client, route, account, locale, messages, settings, components, placeholders}) => (
  <ApolloProvider client={client}>
    <IntlProvider locale={locale} messages={messages}>
      <div>
        <Helmet title={settings ? settings.title || account: account} />
        <Placeholder id={route} />
      </div>
    </IntlProvider>
  </ApolloProvider>
)

Root.propTypes = {
  client: PropTypes.object,
  route: PropTypes.string,
  account: PropTypes.string,
  locale: PropTypes.string,
  messages: PropTypes.object,
  settings: PropTypes.object,
}

if (canUseDOM) {
  try {
    ReactDOM.render(<Root {...state} />, document.getElementById('render-container'))
    console.log('Welcome to Render! Want to look under the hood? http://lab.vtex.com/careers/')
  } catch (e) {
    console.log('Oops!')
    console.error(e)
  }
} else {
  global.rendered = renderToStringWithData(<Root {...state} />).then(markup => ({
    head: Helmet.rewind(),
    markup,
    state: state.client.store.getState()[state.client.reduxRootKey].data
  }))
}

if (canUseDOM && process.env.NODE_ENV !== 'production') {
  global.Perf = require('react-dom/lib/ReactPerf')
}
