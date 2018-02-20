import {canUseDOM} from 'exenv'
import PropTypes from 'prop-types'
import React, {Component} from 'react'
import {ApolloProvider} from 'react-apollo'
import {IntlProvider} from 'react-intl'
import {Helmet} from 'react-helmet'
import {parse} from 'qs'

import {fetchAssets} from '../utils/assets'
import getClient from '../utils/client'
import {loadLocaleData} from '../utils/locales'
import {createLocaleCookie, fetchMessages} from '../utils/messages'
import {fetchRuntime} from '../utils/runtime'
import {pageNameFromPath} from '../utils/pages'

import IntrospectionFetcher from './IntrospectionFetcher'
import NestedExtensionPoints from './NestedExtensionPoints'

class RenderProvider extends Component {
  static childContextTypes = {
    account: PropTypes.string,
    components: PropTypes.object,
    culture: PropTypes.object,
    extensions: PropTypes.object,
    pages: PropTypes.object,
    emitter: PropTypes.object,
    history: PropTypes.object,
    getSettings: PropTypes.func,
    updateRuntime: PropTypes.func,
    updateExtension: PropTypes.func,
    registerEmptyExtension: PropTypes.func,
    onPageChanged: PropTypes.func,
    prefetchPage: PropTypes.func,
    production: PropTypes.bool,
  }

  static propTypes = {
    children: PropTypes.element,
    history: PropTypes.object,
  }

  constructor(props) {
    super(props)
    const {culture, messages, components, extensions, pages, page, query} = global.__RUNTIME__
    const {history} = props

    if (history) {
      const renderLocation = {...history.location, state: {renderRouting: true}}
      history.replace(renderLocation)
      // backwards compatibility
      global.browserHistory = history
    }

    this.emptyExtensions = []

    this.state = {
      components,
      extensions,
      culture,
      messages,
      pages,
      page,
      query,
    }
  }

  componentDidMount() {
    const {production, emitter} = global.__RUNTIME__
    const {history} = this.props
    this.unlisten = history && history.listen(this.onPageChanged)
    emitter.addListener('localesChanged', this.onLocaleSelected)

    if (!production) {
      emitter.addListener('localesUpdated', this.onLocalesUpdated)
      emitter.addListener('extensionsUpdated', this.updateRuntime)
    }

    const {extensions} = this.state
    this.emptyExtensions.forEach((name) => {
      extensions[name] = {
        component: null,
      }
    })
    this.setState({
      extensions,
    })
  }

  componentWillUnmount() {
    const {production, emitter} = global.__RUNTIME__
    this.unlisten && this.unlisten()
    emitter.removeListener('localesChanged', this.onLocaleSelected)

    if (!production) {
      emitter.removeListener('localesUpdated', this.onLocalesUpdated)
      emitter.removeListener('extensionsUpdated', this.updateRuntime)
    }
  }

  getChildContext() {
    const {account, emitter, settings, production} = global.__RUNTIME__
    const {components, extensions, pages, culture} = this.state
    const {history} = this.props

    return {
      account,
      components,
      culture,
      extensions,
      emitter,
      history,
      pages,
      production,
      getSettings: app => settings[app],
      updateRuntime: this.updateRuntime,
      onPageChanged: this.onPageChanged,
      prefetchPage: this.prefetchPage,
      updateExtension: this.updateExtension,
      registerEmptyExtension: this.registerEmptyExtension,
    }
  }

  onPageChanged = (location) => {
    const {pages} = this.state
    const {pathname, state} = location

    // Make sure this came from a Link component
    if (!state || !state.renderRouting) {
      return
    }

    const page = pageNameFromPath(pathname, pages)

    if (!page) {
      window.location.href = `${location.pathname}${location.search}`
      return
    }

    const query = parse(location.search.substr(1))

    this.setState({
      page,
      query,
    })
  }

  prefetchPage = (pageName) => {
    if (canUseDOM) {
      const {components, extensions} = this.state
      return fetchAssets(extensions[pageName], components)
    }
  }

  onLocalesUpdated = (locales) => {
    // Current locale is one of the updated ones
    if (locales.indexOf(this.state.culture.locale) !== -1) {
      // Force cache busting by appending date to url
      fetchMessages()
        .then(messages => {
          this.setState({
            ...this.state,
            messages,
          })
        })
        .catch(e => {
          console.log('Failed to fetch new locale file.')
          console.error(e)
        })
    }
  }

  onLocaleSelected = (locale) => {
    if (locale !== this.state.culture.locale) {
      createLocaleCookie(locale)
      Promise.all([
        fetchMessages(),
        loadLocaleData(locale),
      ])
      .then(([messages]) => {
        this.setState({
          messages,
          culture: {
            ...this.state.culture,
            locale,
          },
        })
      })
      .then(() => window.postMessage({key: 'cookie.locale', body: {locale}}, '*'))
      .catch(e => {
        console.log('Failed to fetch new locale file.')
        console.error(e)
      })
    }
  }

  updateRuntime = () =>
    fetchRuntime().then(({components, extensions, messages, pages}) => {
      // keep client-side params
      Object.keys(pages).forEach(page => {
        pages[page].params = global.__RUNTIME__.pages[page].params
      })

      this.setState({
        components,
        messages,
        extensions,
        pages,
      })

      global.__RUNTIME__.emitter.emit('extension:*:update')

      return global.__RUNTIME__
    })

  updateExtension = (name, extension) => {
    const {extensions} = this.state
    extensions[name] = extension
    this.setState({
      extensions,
    })
  }

  registerEmptyExtension = (name) =>
    this.emptyExtensions.push(name)

  render() {
    const {children} = this.props
    const {culture: {locale}, messages, pages, page, query} = this.state

    const component = children
      ? React.cloneElement(children, {query})
      : (
        <div>
          <Helmet title={pages[page] && pages[page].title} />
          <NestedExtensionPoints page={page} query={query} />
          <IntrospectionFetcher />
        </div>
      )

    return (
      <ApolloProvider client={getClient()}>
        <IntlProvider locale={locale} messages={messages}>
          {component}
        </IntlProvider>
      </ApolloProvider>
    )
  }
}

export default RenderProvider
