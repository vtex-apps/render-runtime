import {canUseDOM} from 'exenv'
import PropTypes from 'prop-types'
import React, {Component} from 'react'
import {ApolloProvider} from 'react-apollo'
import {IntlProvider} from 'react-intl'
import {Helmet} from 'react-helmet'
import {parse} from 'qs'

import {fetchAssets, getImplementation} from '../utils/assets'
import getClient from '../utils/client'
import {loadLocaleData} from '../utils/locales'
import {createLocaleCookie, fetchMessages, fetchMessagesForApp} from '../utils/messages'
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
    page: PropTypes.string,
    pages: PropTypes.object,
    emitter: PropTypes.object,
    history: PropTypes.object,
    getSettings: PropTypes.func,
    updateRuntime: PropTypes.func,
    updateExtension: PropTypes.func,
    onPageChanged: PropTypes.func,
    prefetchPage: PropTypes.func,
    fetchComponent: PropTypes.func,
    production: PropTypes.bool,
  }

  static propTypes = {
    children: PropTypes.element,
    history: PropTypes.object,
  }

  constructor(props) {
    super(props)
    const {culture, messages, components, extensions, pages, page, query, production} = global.__RUNTIME__
    const {history} = props

    if (history) {
      const renderLocation = {...history.location, state: {renderRouting: true}}
      history.replace(renderLocation)
      // backwards compatibility
      global.browserHistory = history
    }

    this.state = {
      components,
      extensions,
      culture,
      messages,
      pages,
      page,
      query,
      production,
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
    const {components, extensions, page, pages, culture} = this.state
    const {history} = this.props

    return {
      account,
      components,
      culture,
      extensions,
      emitter,
      history,
      page,
      pages,
      production,
      getSettings: app => settings[app],
      updateRuntime: this.updateRuntime,
      onPageChanged: this.onPageChanged,
      prefetchPage: this.prefetchPage,
      fetchComponent: this.fetchComponent,
      updateExtension: this.updateExtension,
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
    const {extensions} = this.state
    const component = extensions[pageName].component
    return this.fetchComponent(component)
  }

  fetchComponent = (component) => {
    if (!canUseDOM) {
      throw new Error('Cannot fetch components during server side rendering.')
    }

    const {components, culture: {locale}} = this.state
    const [app] = component.split('/')
    const sameAppAsset = Object.keys(global.__RENDER_6_COMPONENTS__).find((c) => c.startsWith(app))

    if (sameAppAsset) {
      return fetchAssets(components[component])
    }

    return fetchMessagesForApp(app, locale)
      .then((messages) => {
        this.setState({
          messages: {
            ...this.state.messages,
            ...messages,
          },
        })
      })
      .then(() => fetchAssets(components[component]))
  }

  onLocalesUpdated = (locales) => {
    // Current locale is one of the updated ones
    if (locales.indexOf(this.state.culture.locale) !== -1) {
      fetchMessages()
        .then(messages => {
          this.setState({
            messages,
          }, () => global.__RUNTIME__.emitter.emit('extension:*:update'))
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
        }, () => global.__RUNTIME__.emitter.emit('extension:*:update'))
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
      }, () => global.__RUNTIME__.emitter.emit('extension:*:update', this.state))

      return global.__RUNTIME__
    })

  updateExtension = (name, extension) => {
    const {extensions} = this.state

    this.setState({
      extensions: {
        ...extensions,
        [name]: extension,
      },
    }, () => global.__RUNTIME__.emitter.emit(`extension:${name}:update`, this.state))
  }

  render() {
    const {children} = this.props
    const {culture: {locale}, messages, pages, page, query, production, extensions} = this.state

    const component = children
      ? React.cloneElement(children, {query})
      : (
        <div id="render-provider">
          <Helmet title={pages[page] && pages[page].title} />
          <NestedExtensionPoints page={page} query={query} />
          <IntrospectionFetcher />
        </div>
      )

    const root = page.split('/')[0]
    const editorProvider = extensions[`${root}/__provider`]
    const EditorProvider = editorProvider && getImplementation(editorProvider.component)
    const maybeEditable = !production && EditorProvider
      ? <EditorProvider extensions={extensions}>{component}</EditorProvider>
      : component

    return (
      <ApolloProvider client={getClient()}>
        <IntlProvider locale={locale} messages={messages}>
          {maybeEditable}
        </IntlProvider>
      </ApolloProvider>
    )
  }
}

export default RenderProvider
