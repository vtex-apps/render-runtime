import {NormalizedCacheObject} from 'apollo-cache-inmemory'
import ApolloClient from 'apollo-client'
import {ApolloLink, NextLink, Operation} from 'apollo-link'
import {canUseDOM} from 'exenv'
import {History, Location, UnregisterCallback} from 'history'
import PropTypes from 'prop-types'
import {parse} from 'qs'
import React, {Component, Fragment, ReactElement} from 'react'
import {ApolloProvider} from 'react-apollo'
import {Helmet} from 'react-helmet'
import {IntlProvider} from 'react-intl'

import {fetchAssets, getImplementation} from '../utils/assets'
import PageCacheControl from '../utils/cacheControl'
import {getClient} from '../utils/client'
import {traverseComponent} from '../utils/components'
import {RENDER_CONTAINER_CLASS, ROUTE_CLASS_PREFIX, routeClass} from '../utils/dom'
import {loadLocaleData} from '../utils/locales'
import {createLocaleCookie, fetchMessages, fetchMessagesForApp} from '../utils/messages'
import {navigate as pageNavigate, NavigateOptions, routeIdFromPath} from '../utils/pages'
import {fetchRoutes} from '../utils/routes'
import {TreePathContext} from '../utils/treePath'

import BuildStatus from './BuildStatus'
import NestedExtensionPoints from './NestedExtensionPoints'
import {RenderContext} from './RenderContext'

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
  cacheHints: RenderRuntime['cacheHints']
  components: RenderRuntime['components']
  culture: RenderRuntime['culture']
  device: ConfigurationDevice
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
    device: PropTypes.string,
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
    setDevice: PropTypes.func,
    updateComponentAssets: PropTypes.func,
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
    const {appsEtag, cacheHints, culture, messages, components, extensions, pages, page, query, production, settings} = props.runtime
    const {history, baseURI, cacheControl} = props

    if (history) {
      const renderLocation = {...history.location, state: {renderRouting: true}}
      history.replace(renderLocation)
      // backwards compatibility
      window.browserHistory = global.browserHistory = history
    }

    const runtimeContextLink = this.createRuntimeContextLink()
    this.apolloClient = getClient(props.runtime, baseURI, runtimeContextLink, cacheControl)
    this.state = {
      appsEtag,
      cacheHints,
      components,
      culture,
      device: 'any',
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
      const {runtime: {extensions}} = nextProps
      this.setState({extensions})
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
    const {components, extensions, page, pages, settings, culture, device} = this.state
    const {account, emitter, production, workspace} = runtime

    return {
      account,
      components,
      culture,
      device,
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
      setDevice: this.handleSetDevice,
      updateComponentAssets: this.updateComponentAssets,
      updateExtension: this.updateExtension,
      updateRuntime: this.updateRuntime,
      workspace,
    }
  }

  public getCustomMessages = (locale: string) => {
    const {components} = this.state
    const componentsArray = Object.keys(components)

    const customMessages = componentsArray
          .map(getImplementation)
          .filter(component => component && component.getCustomMessages)
          .map(component => component.getCustomMessages!(locale))
          .reduce(Object.assign, {})

    return customMessages
  }

  public navigate = (options: NavigateOptions) => {
    const {history} = this.props
    const {pages} = this.state
    return pageNavigate(history, pages, options)
  }

  public replaceRouteClass = (route: string) => {
    try {
      const containers = document.getElementsByClassName(RENDER_CONTAINER_CLASS)
      const currentRouteClass = containers[0].className.split(' ').find(c => c.startsWith(ROUTE_CLASS_PREFIX))
      const newRouteClass = routeClass(route)

      Array.prototype.forEach.call(
        containers,
        (e: any) => e.classList.replace(currentRouteClass, newRouteClass),
      )
    } catch (e) {
      console.error('Failed to set route class', routeClass(route))
    }
  }

  public scrollTo = (scrollOptions?: RenderScrollOptions) => {
    try {
      if (scrollOptions === false) {
        return
      }

      const options = scrollOptions || { top: 0, left: 0, behavior: 'smooth' }
      const editModeContainer = document.getElementById('app-content')
      if (editModeContainer) {
        editModeContainer.scrollTo(options)
      } else {
        window.scrollTo(options)
      }
    }
    catch (e) {
      console.warn('Failed to scroll after page navigation.')
    }
  }

  public afterPageChanged = (route: string, scrollOptions?: RenderScrollOptions) => {
    this.replaceRouteClass(route)
    this.scrollTo(scrollOptions)
  }

  public onPageChanged = (location: RenderHistoryLocation) => {
    const {runtime: {renderMajor}} = this.props
    const {culture: {locale}, pages: pagesState, production, device} = this.state
    const {pathname, state} = location

    // Make sure this is our navigation
    if (!state || !state.renderRouting) {
      return
    }

    const page = routeIdFromPath(pathname, pagesState)

    if (!page) {
      window.location.href = `${location.pathname}${location.search}`
      return
    }

    const isConditional = pagesState[page] && pagesState[page].conditional

    const query = parse(location.search.substr(1))

    if (!isConditional) {
      return this.setState({
        page,
        query,
      }, () => this.afterPageChanged(page, state.scrollOptions))
    }

    // Retrieve the adequate assets for the new page. Naming will
    // probably change (query will return something like routes) as
    // well as the fields that need to be retrieved, but the logic
    // that the new state (extensions and assets) will be derived from
    // the results of this query will probably remain the same.
    return fetchRoutes({
      apolloClient: this.apolloClient,
      device,
      locale,
      page,
      path: pathname,
      production,
      renderMajor,
    }).then(({
      appsEtag,
      cacheHints,
      components,
      extensions,
      messages,
      pages,
      settings
    }: ParsedPageQueryResponse) => {
      this.setState({
        appsEtag,
        cacheHints,
        components,
        extensions,
        messages,
        page,
        pages,
        query,
        settings,
      }, () => this.afterPageChanged(page))
    })
  }

  public prefetchPage = (pageName: string) => {
    const {extensions} = this.state
    const component = extensions[pageName].component
    return this.fetchComponent(component)
  }

  public updateComponentAssets = (availableComponents: Components) => {
    this.setState({ components: {
        ...this.state.components,
        ...availableComponents,
      }
    })
  }

  public fetchComponent = (component: string) => {
    if (!canUseDOM) {
      throw new Error('Cannot fetch components during server side rendering.')
    }

    const {components, culture: {locale}} = this.state
    const {apps, assets} = traverseComponent(components, component)
    const unfetchedApps = apps.filter(app => !Object.keys(window.__RENDER_7_COMPONENTS__).some(c => c.startsWith(app)))
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
    const {runtime: {renderMajor}} = this.props
    const {page, production, culture: {locale}} = this.state

    // Current locale is one of the updated ones
    if (locales.indexOf(this.state.culture.locale) !== -1) {
      fetchMessages(this.apolloClient, page, production, locale, renderMajor)
        .then(messages => {
          this.setState({messages})
        })
        .catch(e => {
          console.log('Failed to fetch new locale file.')
          console.error(e)
        })
    }
  }

  public onLocaleSelected = (locale: string) => {
    const {runtime: {renderMajor}} = this.props
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
        })
      })
      .then(() => window.postMessage({key: 'cookie.locale', body: {locale}}, '*'))
      .catch(e => {
        console.log('Failed to fetch new locale file.')
        console.error(e)
      })
    }
  }

  public updateRuntime = (options?: PageContextOptions) => {
    const {runtime: {renderMajor}} = this.props
    const {page, production, culture: {locale}} = this.state
    const {pathname} = window.location

    return fetchRoutes({
      apolloClient: this.apolloClient,
      locale,
      page,
      path: pathname,
      production,
      renderMajor,
      ...options,
    }).then(({
      appsEtag,
      cacheHints,
      components,
      extensions,
      messages,
      pages,
      settings
    }: ParsedPageQueryResponse) => {
      this.setState({
        appsEtag,
        cacheHints,
        components,
        extensions,
        messages,
        page,
        pages,
        settings,
      })
    })
  }

  public createRuntimeContextLink() {
    return new ApolloLink((operation: Operation, forward?: NextLink) => {
      const {appsEtag, cacheHints, components, extensions, messages, pages} = this.state
      operation.setContext((currentContext: Record<string, any>) => {
        return {
          ...currentContext,
          runtime: {
            appsEtag,
            cacheHints,
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
    const {extensions} = this.state

    this.setState({
      extensions: {
        ...extensions,
        [name]: extension,
      },
    })
  }

  public handleSetDevice = (device: ConfigurationDevice) => {
    this.setState({ device })
  }

  public render() {
    const {children} = this.props
    const {culture: {locale}, messages, pages, page, query, production, extensions} = this.state
    const customMessages = this.getCustomMessages(locale)
    const mergedMessages = {
      ...messages,
      ...customMessages
    }

    const component = children
      ? React.cloneElement(children as ReactElement<any>, {query})
      : (
        <div className="render-provider">
          <Helmet title={pages[page] && pages[page].title} />
          <NestedExtensionPoints page={page} query={query} />
        </div>
      )

    const root = page.split('/')[0]
    const editorProvider = extensions[`${root}/__provider`]
    const context = this.getChildContext()
    const EditorProvider = editorProvider && getImplementation<any>(editorProvider.component)
    const maybeEditable = !production && EditorProvider
      ? <EditorProvider runtime={context} extensions={extensions} pages={pages} page={page}>{component}</EditorProvider>
      : component

    return (
      <RenderContext.Provider value={context}>
        <TreePathContext.Provider value={{treePath: ''}}>
          <ApolloProvider client={this.apolloClient}>
            <IntlProvider locale={locale} messages={mergedMessages}>
              <Fragment>
                {!production && <BuildStatus />}
                {maybeEditable}
              </Fragment>
            </IntlProvider>
          </ApolloProvider>
        </TreePathContext.Provider>
      </RenderContext.Provider>
    )
  }
}

export default RenderProvider
