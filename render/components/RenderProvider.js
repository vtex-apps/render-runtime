import React, {Component} from 'react'
import PropTypes from 'prop-types'
import {IntlProvider} from 'react-intl'

const YEAR_IN_MS = 12 * 30 * 24 * 60 * 60 * 1000

const fetchLocale = (locale, hash) =>
  fetch(`/assets/locales/${locale}.json?hash=${hash}`)
    .then(res => res.json())

const createLocaleCookie = locale => {
  const yearFromNow = Date.now() + YEAR_IN_MS
  const expires = new Date(yearFromNow).toUTCString()
  const localeCookie = `locale=${locale};path=/;expires=${expires}`
  window.document.cookie = localeCookie
}

class RenderProvider extends Component {
  constructor (props) {
    super(props)
    this.state = {
      locale: props.locale,
      messages: props.messages,
    }
  }

  componentDidMount () {
    window.addEventListener('message', e => {
      const event = e.data
      if (!event.key && !event.body) {
        return
      }
      const {key, body} = event
      switch (key) {
        case 'workspace.locales':
          this.onLocalesUpdated(body)
          break
        case 'render.locale':
          this.onLocaleSelected(body)
          break
      }
    })
  }

  onLocalesUpdated ({locales}) {
    // Current locale is one of the updated ones
    if (locales.indexOf(this.state.locale) !== -1) {
      // Force cache busting by appending date to hash
      fetchLocale(this.state.locale, this.props.hash + Date.now())
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

  onLocaleSelected ({locale}) {
    // Current locale is one of the updated ones
    if (locale !== this.state.locale) {
      fetchLocale(locale, this.props.hash)
        .then(messages => {
          global.__RUNTIME__.culture.locale = locale
          this.setState({locale, messages})
        })
        .then(() => createLocaleCookie(locale))
        .catch(e => {
          console.log('Failed to fetch new locale file.')
          console.error(e)
        })
    }
  }

  getChildContext () {
    return {
      account: this.props.account,
      placeholders: this.props.placeholders,
      route: this.props.route,
      getSettings: (locator) => this.props.settings[locator],
    }
  }

  render () {
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
  placeholders: PropTypes.object,
  settings: PropTypes.object,
  route: PropTypes.string,
  messages: PropTypes.object,
  locale: PropTypes.string,
  hash: PropTypes.string,
}

RenderProvider.childContextTypes = {
  account: PropTypes.string,
  placeholders: PropTypes.object,
  route: PropTypes.string,
  getSettings: PropTypes.func,
}

export default RenderProvider
