import {canUseDOM} from 'exenv'
import React, {Component} from 'react'
import PropTypes from 'prop-types'
import {IntlProvider} from 'react-intl'

const YEAR_IN_MS = 12 * 30 * 24 * 60 * 60 * 1000

const acceptJson = canUseDOM && new Headers({
  'Accept': 'application/json',
})

const fetchMessages = () =>
  fetch('?vtex.render-resource=messages', {
    headers: acceptJson,
  }).then(res => res.json())

const fetchRuntime = () =>
  fetch('?vtex.render-resource=runtime', {
    headers: acceptJson,
  }).then(res => res.json())

const updateInPlace = (old, current) => {
  Object.keys(old).forEach((oldKey) => {
    if (!current[oldKey]) {
      delete old[oldKey]
    }
  })

  Object.keys(current).forEach((key) => {
    old[key] = current[key]
  })
}

const createLocaleCookie = locale => {
  const yearFromNow = Date.now() + YEAR_IN_MS
  const expires = new Date(yearFromNow).toUTCString()
  const localeCookie = `locale=${locale};path=/;expires=${expires}`
  window.document.cookie = localeCookie
}

class RenderProvider extends Component {
  constructor(props) {
    super(props)
    this.state = {
      locale: props.locale,
      messages: props.messages,
    }
  }

  componentDidMount() {
    const {production, eventEmitter} = global.__RUNTIME__
    eventEmitter.addListener('localesChanged', this.onLocaleSelected)

    if (!production) {
      eventEmitter.addListener('localesUpdated', this.onLocalesUpdated)
      eventEmitter.addListener('extensionsUpdated', this.updateRuntime)
    }
  }

  onLocalesUpdated(locales) {
    // Current locale is one of the updated ones
    if (locales.indexOf(this.state.locale) !== -1) {
      // Force cache busting by appending date to url
      fetchMessages()
        .then(messages => {
          this.setState({
            locale: this.state.locale,
            messages,
          })
        })
        .catch(e => {
          console.log('Failed to fetch new locale file.')
          console.error(e)
        })
    }
  }

  onLocaleSelected(locale) {
    // Current locale is one of the updated ones
    if (locale !== this.state.locale) {
      fetchMessages()
        .then(messages => {
          global.__RUNTIME__.culture.locale = locale
          this.setState({locale, messages})
        })
        .then(() => createLocaleCookie(locale))
        .then(() => window.postMessage({key: 'cookie.locale', body: {locale}}, '*'))
        .catch(e => {
          console.log('Failed to fetch new locale file.')
          console.error(e)
        })
    }
  }

  getChildContext() {
    const {account, extensions, page, pages, settings} = global.__RUNTIME__
    return {
      account,
      extensions,
      pages,
      page,
      getSettings: locator => settings[locator],
      updateRuntime: this.updateRuntime,
    }
  }

  updateRuntime = () =>
    Promise.all([
      fetchMessages(),
      fetchRuntime(),
    ]).then(([messages, {extensions, pages}]) => {
      // keep client-side params
      Object.keys(pages).forEach(page => {
        pages[page].params = global.__RUNTIME__.pages[page].params
      })

      updateInPlace(global.__RUNTIME__.messages, messages)
      updateInPlace(global.__RUNTIME__.extensions, extensions)
      updateInPlace(global.__RUNTIME__.pages, pages)

      global.__RUNTIME__.eventEmitter.emit('extension:*:update')

      return global.__RUNTIME__
    })

  render() {
    const {locale, messages} = this.state
    return (
      <IntlProvider locale={locale} messages={messages}>
        {React.Children.only(this.props.children)}
      </IntlProvider>
    )
  }
}

RenderProvider.propTypes = {
  children: PropTypes.element.isRequired,
  account: PropTypes.string,
  extensions: PropTypes.object,
  pages: PropTypes.object,
  settings: PropTypes.object,
  page: PropTypes.string,
  messages: PropTypes.object,
  locale: PropTypes.string,
}

RenderProvider.childContextTypes = {
  account: PropTypes.string,
  extensions: PropTypes.object,
  pages: PropTypes.object,
  page: PropTypes.string,
  getSettings: PropTypes.func,
  updateRuntime: PropTypes.func,
}

export default RenderProvider
