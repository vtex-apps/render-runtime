import React, {Component} from 'react'
import PropTypes from 'prop-types'
import {IntlProvider} from 'react-intl'

const YEAR_IN_MS = 12 * 30 * 24 * 60 * 60 * 1000

const fetchLocale = (locale, version) =>
  fetch(`/_v/messages/${locale}${version ? '?v=' + version : ''}`).then(res => res.json())

const createLocaleCookie = locale => {
  const yearFromNow = Date.now() + YEAR_IN_MS
  const expires = new Date(yearFromNow).toUTCString()
  const localeCookie = `locale=${locale};path=/;expires=${expires}`
  window.document.cookie = localeCookie
}

function mergePlaceholders(local, server) {
  const merged = {}
  for (name in server) {
    if (local[name] && server[name]) {
      merged[name] = local[name]
    } else if (server[name]) {
      merged[name] = server[name]
    }
  }
  return merged
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
    window.addEventListener('message', e => {
      const event = e.data
      if (!event.key && !event.body) {
        return
      }
      const {key, body} = event
      switch (key) {
        case 'browser':
          if (body.type === 'locales') {
            this.onLocalesUpdated(body)
          }
          break
        case 'render.locale':
          this.onLocaleSelected(body)
          break
      }
    })
  }

  onLocalesUpdated({locales}) {
    // Current locale is one of the updated ones
    if (locales.indexOf(this.state.locale) !== -1) {
      // Force cache busting by appending date to url
      fetchLocale(this.state.locale, Date.now())
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

  onLocaleSelected({locale}) {
    // Current locale is one of the updated ones
    if (locale !== this.state.locale) {
      fetchLocale(locale)
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
    const {account, extensions, route, settings, locale} = this.props
    return {
      account,
      extensions,
      route,
      getSettings: locator => settings[locator],
      updateRuntime: () => {
        return Promise.all([
          fetch(`/_v/messages/${locale}`).then(res => res.json()),
          fetch('/_v/extensions.json').then(res => res.json()),
        ]).then(([messages, extensions]) => {
          Object.assign(global.__RUNTIME__.messages, messages)
          global.__RUNTIME__.extensions = mergePlaceholders(
            global.__RUNTIME__.extensions,
            extensions,
          )
        })
      },
    }
  }

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
  settings: PropTypes.object,
  route: PropTypes.string,
  messages: PropTypes.object,
  locale: PropTypes.string,
}

RenderProvider.childContextTypes = {
  account: PropTypes.string,
  extensions: PropTypes.object,
  route: PropTypes.string,
  getSettings: PropTypes.func,
  updateRuntime: PropTypes.func,
}

export default RenderProvider
