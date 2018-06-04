import {canUseDOM} from 'exenv'
import PropTypes from 'prop-types'
import {parse} from 'qs'
import React, {Component, ReactElement} from 'react'
import {ApolloProvider} from 'react-apollo'
import {Helmet} from 'react-helmet'
import {IntlProvider} from 'react-intl'

import {History, Location, LocationListener, UnregisterCallback} from 'history'
import {fetchAssets} from '../utils/assets'
import {getClient} from '../utils/client'
import {loadLocaleData} from '../utils/locales'
import {createLocaleCookie, fetchMessages, fetchMessagesForApp} from '../utils/messages'
import {navigate as pageNavigate, NavigateOptions, pageNameFromPath} from '../utils/pages'
import {fetchRuntime} from '../utils/runtime'

import {NormalizedCacheObject} from 'apollo-cache-inmemory'
import ApolloClient from 'apollo-client'
import {ApolloLink, NextLink, Operation} from 'apollo-link'
import PageCacheControl from '../utils/cacheControl'
import {traverseComponent} from '../utils/components'
import BuildStatus from './BuildStatus'
import ExtensionPointComponent from './ExtensionPointComponent'
import NestedExtensionPoints from './NestedExtensionPoints'

interface Props {
  children: ReactElement<any> | null
  history: History | null
  cacheControl?: PageCacheControl
  baseURI: string
  root: string
  runtime: RenderRuntime
}

export interface RenderProviderState {
  appsEtag: RenderRuntime['appsEtag']
  components: RenderRuntime['components']
  culture: RenderRuntime['culture']
  extensions: RenderRuntime['extensions']
  messages: RenderRuntime['messages']
  page: RenderRuntime['page']
  pages: RenderRuntime['pages']
  production: RenderRuntime['production']
  query: RenderRuntime['query']
  settings: RenderRuntime['settings']
}

class RenderProvider extends Component<Props, RenderProviderState> {
  public static childContextTypes = {
    account: PropTypes.string,
    components: PropTypes.object,
    culture: PropTypes.object,
    emitter: PropTypes.object,
    extensions: PropTypes.object,
    fetchComponent: PropTypes.func,
    getSettings: PropTypes.func,
    history: PropTypes.object,
    navigate: PropTypes.func,
    onPageChanged: PropTypes.func,
    page: PropTypes.string,
    pages: PropTypes.object,
    prefetchPage: PropTypes.func,
    production: PropTypes.bool,
    updateExtension: PropTypes.func,
    updateRuntime: PropTypes.func,
    workspace: PropTypes.string,
  }

  public static propTypes = {
    children: PropTypes.element,
    history: PropTypes.object,
    root: PropTypes.string,
    runtime: PropTypes.object,
  }

  private rendered!: boolean
  private unlisten!: UnregisterCallback | null
  private apolloClient: ApolloClient<NormalizedCacheObject>

  constructor(props: Props) {
    super(props)
    const {appsEtag, culture, messages, components, extensions, pages, page, query, production, settings} = props.runtime
    const {history, baseURI, cacheControl} = props

    if (history) {
      const renderLocation = {...history.location, state: {renderRouting: true}}
      history.replace(renderLocation)
      // backwards compatibility
      global.browserHistory = history
    }

    const runtimeContextLink = this.createRuntimeContextLink()
    this.apolloClient = getClient(props.runtime, baseURI, runtimeContextLink, cacheControl)
    this.state = {
      appsEtag,
      components,
      culture,
      extensions,
      messages,
      page,
      pages,
      production,
      query,
      settings,
    }
  }

  public componentDidMount() {
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

  public componentWillReceiveProps(nextProps: Props) {
    // If RenderProvider is being re-rendered, the global runtime might have changed
    // so we must update the all extensions.
    if (this.rendered) {
      const {runtime: {extensions, emitter}} = nextProps
      this.setState({extensions}, () => emitter.emit('extension:*:update', this.state))
    }
  }

  public componentWillUnmount() {
    const {runtime} = this.props
    const {production, emitter} = runtime
    if (this.unlisten) {
      this.unlisten()
    }
    emitter.removeListener('localesChanged', this.onLocaleSelected)

    if (!production) {
      emitter.removeListener('localesUpdated', this.onLocalesUpdated)
      emitter.removeListener('extensionsUpdated', this.updateRuntime)
    }
  }

  public getChildContext() {
    const {history, runtime} = this.props
    const {components, extensions, page, pages, settings, culture} = this.state
    const {account, emitter, production, workspace} = runtime

    return {
      account,
      components,
      culture,
      emitter,
      extensions,
      fetchComponent: this.fetchComponent,
      getSettings: (app: string) => settings[app],
      history,
      navigate: this.navigate,
      onPageChanged: this.onPageChanged,
      page,
      pages,
      prefetchPage: this.prefetchPage,
      production,
      updateExtension: this.updateExtension,
      updateRuntime: this.updateRuntime,
      workspace,
    }
  }

  public navigate = (options: NavigateOptions) => {
    const {history} = this.props
    const {pages} = this.state
    return pageNavigate(history, pages, options)
  }

  public onPageChanged = (location: Location) => {
    const {pages} = this.state
    const {pathname, state} = location

    // Make sure this is our navigation
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

  public prefetchPage = (pageName: string) => {
    const {extensions} = this.state
    const component = extensions[pageName].component
    return this.fetchComponent(component)
  }

  public fetchComponent = (component: string) => {
    if (!canUseDOM) {
      throw new Error('Cannot fetch components during server side rendering.')
    }

    const {components, culture: {locale}} = this.state
    const {apps, assets} = traverseComponent(components, component)
    const unfetchedApps = apps.filter(app => !Object.keys(global.__RENDER_7_COMPONENTS__).some(c => c.startsWith(app)))
    if (unfetchedApps.length === 0) {
      return fetchAssets(assets)
    }

    const messagesPromises = Promise.all(unfetchedApps.map(app => fetchMessagesForApp(this.apolloClient, app, locale)))
    const assetsPromise = fetchAssets(assets)

    return Promise.all([messagesPromises, assetsPromise]).then(([messages]) => {
      this.setState({
        messages: {
          ...this.state.messages,
          ...Object.assign({}, ...messages),
        },
      })
    })
  }

  public onLocalesUpdated = (locales: string[]) => {
    const {runtime: {emitter, renderMajor}} = this.props
    const {page, production, culture: {locale}} = this.state

    // Current locale is one of the updated ones
    if (locales.indexOf(this.state.culture.locale) !== -1) {
      fetchMessages(this.apolloClient, page, production, locale, renderMajor)
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

  public onLocaleSelected = (locale: string) => {
    const {runtime: {emitter, renderMajor}} = this.props
    const {page, production} = this.state

    if (locale !== this.state.culture.locale) {
      createLocaleCookie(locale)
      Promise.all([
        fetchMessages(this.apolloClient, page, production, locale, renderMajor),
        loadLocaleData(locale),
      ])
      .then(([messages]) => {
        this.setState({
          culture: {
            ...this.state.culture,
            locale,
          },
          messages,
        }, () => emitter.emit('extension:*:update'))
      })
      .then(() => window.postMessage({key: 'cookie.locale', body: {locale}}, '*'))
      .catch(e => {
        console.log('Failed to fetch new locale file.')
        console.error(e)
      })
    }
  }

  public updateRuntime = () => {
    const {runtime: {emitter, renderMajor}} = this.props
    const {page, production, culture: {locale}} = this.state

    return fetchRuntime(this.apolloClient, page, production, locale, renderMajor)
      .then(({appsEtag, components, extensions, messages, pages, settings}) => {
        this.setState({
          appsEtag,
          components,
          extensions,
          messages,
          pages,
          settings,
        }, () => emitter.emit('extension:*:update', this.state))
      })
  }

  public createRuntimeContextLink() {
    return new ApolloLink((operation: Operation, forward?: NextLink) => {
      const {appsEtag, components, extensions, messages, pages} = this.state
      operation.setContext((currentContext: Record<string, any>) => {
        return {
          ...currentContext,
          runtime: {
            appsEtag,
            components,
            extensions,
            messages,
            pages,
          },
        }
      })
      return forward ? forward(operation) : null
    })
  }

  public updateExtension = (name: string, extension: Extension) => {
    const {runtime: {emitter}} = this.props
    const {extensions} = this.state

    this.setState({
      extensions: {
        ...extensions,
        [name]: extension,
      },
    }, () => emitter.emit(`extension:${name}:update`, this.state))
  }

  public render() {
    const {children, runtime} = this.props
    const {culture: {locale}, messages, pages, page, query, production, extensions} = this.state

    const component = children
      ? React.cloneElement(children as ReactElement<any>, {query})
      : (
        <div className="render-provider">
          <Helmet title={pages[page] && pages[page].title} />
          {!production && <BuildStatus />}
          <NestedExtensionPoints page={page} query={query} />
        </div>
      )

    const root = page.split('/')[0]
    const editorProvider = extensions[`${root}/__provider`]
    const maybeEditable = !production && editorProvider
      ? <ExtensionPointComponent component={editorProvider.component} props={{extensions, pages, page}}>{component}</ExtensionPointComponent>
      : component

    return (
      <ApolloProvider client={this.apolloClient}>
        <IntlProvider locale={locale} messages={messages}>
          {maybeEditable}
        </IntlProvider>
      </ApolloProvider>
    )
  }
}

export default RenderProvider
