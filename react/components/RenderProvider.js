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

const createLocaleCookie = locale => {
  const yearFromNow = Date.now() + YEAR_IN_MS
  const expires = new Date(yearFromNow).toUTCString()
  const localeCookie = `locale=${locale};path=/;expires=${expires}`
  window.document.cookie = localeCookie
}

function merge(local, server) {
  const merged = {}
  for (const name in server) {
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

  onLocaleSelected({locale}) {
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
    const {account, extensions, pages, page, settings} = this.props
    return {
      account,
      extensions,
      pages,
      page,
      getSettings: locator => settings[locator],
      updateRuntime: () => {
        console.log('TODO: get this information from ?page')
        return Promise.all([
          fetch('?vtex.render-resource=messages', {
            headers: acceptJson,
          }).then(res => res.json()),
          fetch('?vtex.render-resource=runtime', {
            headers: acceptJson,
          }).then(res => res.json()),
        ]).then(([messages, {extensions, pages}]) => {
          Object.assign(global.__RUNTIME__.messages, messages)
          global.__RUNTIME__.extensions = merge(
            global.__RUNTIME__.extensions,
            extensions,
          )
          global.__RUNTIME__.pages = merge(
            global.__RUNTIME__.pages,
            pages,
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
