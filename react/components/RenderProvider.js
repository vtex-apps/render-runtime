import {canUseDOM} from 'exenv'
import PropTypes from 'prop-types'
import React, {Component} from 'react'
import {ApolloProvider} from 'react-apollo'
import {IntlProvider} from 'react-intl'
import {Helmet} from 'react-helmet'
import {parse} from 'qs'

import ExtensionPointComponent from './ExtensionPointComponent'
import {fetchAssets} from '../utils/assets'
import {getClient} from '../utils/client'
import {loadLocaleData} from '../utils/locales'
import {createLocaleCookie, fetchMessages, fetchMessagesForApp} from '../utils/messages'
import {fetchRuntime} from '../utils/runtime'
import {pageNameFromPath} from '../utils/pages'

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
    root: PropTypes.string,
    runtime: PropTypes.object,
  }

  constructor(props) {
    super(props)
    const {culture, messages, components, extensions, pages, page, query, production} = props.runtime
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
    this.rendered = true
    const {history, runtime} = this.props
    const {production, emitter} = runtime

    this.unlisten = history && history.listen(this.onPageChanged)
    emitter.addListener('localesChanged', this.onLocaleSelected)

    if (!production) {
      emitter.addListener('localesUpdated', this.onLocalesUpdated)
      emitter.addListener('extensionsUpdated', this.updateRuntime)
    }
  }

  componentWillReceiveProps(nextProps) {
    // If RenderProvider is being re-rendered, the global runtime might have changed
    // so we must update the root extension.
    if (this.rendered) {
      console.log('updating root extension from runtime', nextProps.root)
      this.updateExtension(nextProps.root, nextProps.runtime.extensions[nextProps.root])
    }
  }

  componentWillUnmount() {
    const {runtime} = this.props
    const {production, emitter} = runtime
    this.unlisten && this.unlisten()
    emitter.removeListener('localesChanged', this.onLocaleSelected)

    if (!production) {
      emitter.removeListener('localesUpdated', this.onLocalesUpdated)
      emitter.removeListener('extensionsUpdated', this.updateRuntime)
    }
  }

  getChildContext() {
    const {history, runtime} = this.props
    const {components, extensions, page, pages, culture} = this.state
    const {account, emitter, settings, production} = runtime

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

    return fetchMessagesForApp(this.props.runtime.graphQlUri.browser, app, locale)
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
    const {runtime: {emitter}} = this.props

    // Current locale is one of the updated ones
    if (locales.indexOf(this.state.culture.locale) !== -1) {
      fetchMessages(this.props.runtime.graphQlUri.browser)
        .then(messages => {
          this.setState({
            messages,
          }, () => emitter.emit('extension:*:update'))
        })
        .catch(e => {
          console.log('Failed to fetch new locale file.')
          console.error(e)
        })
    }
  }

  onLocaleSelected = (locale) => {
    const {runtime: {emitter}} = this.props

    if (locale !== this.state.culture.locale) {
      createLocaleCookie(locale)
      Promise.all([
        fetchMessages(this.props.runtime.graphQlUri.browser),
        loadLocaleData(locale),
      ])
      .then(([messages]) => {
        this.setState({
          messages,
          culture: {
            ...this.state.culture,
            locale,
          },
        }, () => emitter.emit('extension:*:update'))
      })
      .then(() => window.postMessage({key: 'cookie.locale', body: {locale}}, '*'))
      .catch(e => {
        console.log('Failed to fetch new locale file.')
        console.error(e)
      })
    }
  }

  updateRuntime = () =>
    fetchRuntime(this.props.runtime.graphQlUri.browser).then(({components, extensions, messages, pages}) => {
      const {runtime: {emitter}} = this.props

      this.setState({
        components,
        messages,
        extensions,
        pages,
      }, () => emitter.emit('extension:*:update', this.state))
    })

  updateExtension = (name, extension) => {
    const {runtime: {emitter}} = this.props
    const {extensions} = this.state

    this.setState({
      extensions: {
        ...extensions,
        [name]: extension,
      },
    }, () => emitter.emit(`extension:${name}:update`, this.state))
  }

  render() {
    const {children, runtime} = this.props
    const {culture: {locale}, messages, pages, page, query, production, extensions} = this.state

    const component = children
      ? React.cloneElement(children, {query})
      : (
        <div id="render-provider">
          <Helmet title={pages[page] && pages[page].title} />
          <NestedExtensionPoints page={page} query={query} />
        </div>
      )

    const root = page.split('/')[0]
    const editorProvider = extensions[`${root}/__provider`]
    const maybeEditable = !production && editorProvider
      ? <ExtensionPointComponent component={editorProvider.component} props={{extensions}}>{component}</ExtensionPointComponent>
      : component

    return (
      <ApolloProvider client={getClient(runtime)}>
        <IntlProvider locale={locale} messages={messages}>
          {maybeEditable}
        </IntlProvider>
      </ApolloProvider>
    )
  }
}

export default RenderProvider
