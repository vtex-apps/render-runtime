import { NormalizedCacheObject } from 'apollo-cache-inmemory'
import ApolloClient from 'apollo-client'
import { Subscription } from 'apollo-client/util/Observable'
import { ApolloLink, NextLink, Observable, Operation } from 'apollo-link'
import debounce from 'debounce'
import { canUseDOM } from 'exenv'
import { History, UnregisterCallback } from 'history'
import PropTypes from 'prop-types'
import { parse } from 'qs'
import React, { Component, Fragment, ReactElement } from 'react'
import { ApolloProvider } from 'react-apollo'
import { Helmet } from 'react-helmet'
import { IntlProvider } from 'react-intl'

import { fetchAssets, getImplementation, preloadAssets } from '../utils/assets'
import PageCacheControl from '../utils/cacheControl'
import { getClient } from '../utils/client'
import { traverseComponent } from '../utils/components'
import { RENDER_CONTAINER_CLASS, ROUTE_CLASS_PREFIX, routeClass } from '../utils/dom'
import { loadLocaleData } from '../utils/locales'
import { createLocaleCookie, fetchMessages, fetchMessagesForApp } from '../utils/messages'
import { getRouteFromPath, navigate as pageNavigate, NavigateOptions, scrollTo as pageScrollTo } from '../utils/pages'
import { fetchDefaultPages, fetchRoutes } from '../utils/routes'
import { TreePathContext } from '../utils/treePath'
import ExtensionPoint from './ExtensionPoint'

import BuildStatus from './BuildStatus'
import NestedExtensionPoints from './NestedExtensionPoints'
import { RenderContext } from './RenderContext'

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
  defaultExtensions: RenderRuntime['defaultExtensions']
  device: ConfigurationDevice
  extensions: RenderRuntime['extensions']
  messages: RenderRuntime['messages']
  page: RenderRuntime['page']
  pages: RenderRuntime['pages']
  preview: RenderRuntime['preview']
  production: RenderRuntime['production']
  query: RenderRuntime['query']
  settings: RenderRuntime['settings']
  route: RenderRuntime['route']
}

const SEND_INFO_DEBOUNCE_MS = 100
const isStorefrontIframe = canUseDOM && window.top !== window.self && window.top.__provideRuntime
// tslint:disable-next-line:no-empty
const noop = (() => {})

const unionKeys = (record1: any, record2: any) => [...new Set([...Object.keys(record1), ...Object.keys(record2)])]

const isChildOrSelf = (child: string, parent: string) =>
  child === parent || (child.startsWith(`${parent}/`) && child !== `${parent}/__context`)

const replaceExtensionsWithDefault = (extensions: Extensions, page: string, defaultExtensions: Extensions) =>
  unionKeys(extensions, defaultExtensions)
  .reduce((acc, key) => {
    const maybeExtension = isChildOrSelf(key, page)
      ? defaultExtensions[key]
      : extensions[key]
    if (maybeExtension) {
      acc[key] = maybeExtension
    }
    return acc
  }, {} as Extensions)

class RenderProvider extends Component<Props, RenderProviderState> {
  public static childContextTypes = {
    account: PropTypes.string,
    components: PropTypes.object,
    culture: PropTypes.object,
    defaultExtensions: PropTypes.object,
    device: PropTypes.string,
    emitter: PropTypes.object,
    ensureSession: PropTypes.func,
    extensions: PropTypes.object,
    fetchComponent: PropTypes.func,
    getSettings: PropTypes.func,
    hints: PropTypes.object,
    history: PropTypes.object,
    navigate: PropTypes.func,
    onPageChanged: PropTypes.func,
    page: PropTypes.string,
    pages: PropTypes.object,
    patchSession: PropTypes.func,
    prefetchDefaultPages: PropTypes.func,
    prefetchPage: PropTypes.func,
    preview: PropTypes.bool,
    production: PropTypes.bool,
    publicEndpoint: PropTypes.string,
    route: PropTypes.object,
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

  public sendInfoFromIframe = debounce((shouldUpdateRuntime?: boolean) => {
    if (isStorefrontIframe) {
      const { messages } = this.state
      window.top.__provideRuntime(this.getChildContext(), messages, shouldUpdateRuntime)
    }
  }, SEND_INFO_DEBOUNCE_MS)

  private rendered!: boolean
  private sessionPromise: Promise<void>
  private unlisten!: UnregisterCallback | null
  private apolloClient: ApolloClient<NormalizedCacheObject>

  constructor(props: Props) {
    super(props)
    const { appsEtag, cacheHints, culture, messages, components, extensions, pages, page, query, production, settings } = props.runtime
    const { history, baseURI, cacheControl } = props
    const path = canUseDOM ? window.location.pathname : window.__pathname__
    const route = props.runtime.route || getRouteFromPath(path, pages)

    if (history) {
      const renderLocation = { ...history.location, state: { renderRouting: true, route } }
      history.replace(renderLocation)
      // backwards compatibility
      window.browserHistory = global.browserHistory = history
    }

    // todo: reload window if client-side created a segment different from server-side
    this.sessionPromise = canUseDOM ? window.__RENDER_7_SESSION__.sessionPromise : Promise.resolve()
    const runtimeContextLink = this.createRuntimeContextLink()
    const ensureSessionLink = this.createEnsureSessionLink()
    this.apolloClient = getClient(props.runtime, baseURI, runtimeContextLink, ensureSessionLink, cacheControl)

    this.state = {
      appsEtag,
      cacheHints,
      components,
      culture,
      defaultExtensions: {},
      device: 'any',
      extensions,
      messages,
      page,
      pages,
      preview: false,
      production,
      query,
      route,
      settings,
    }
  }

  public componentDidMount() {
    this.rendered = true
    const { history, runtime } = this.props
    const { production, emitter } = runtime

    this.unlisten = history && history.listen(this.onPageChanged)
    emitter.addListener('localesChanged', this.onLocaleSelected)

    if (!production) {
      emitter.addListener('localesUpdated', this.onLocalesUpdated)
      emitter.addListener('extensionsUpdated', this.updateRuntime)
    }

    this.sendInfoFromIframe()
  }

  public componentWillReceiveProps(nextProps: Props) {
    // If RenderProvider is being re-rendered, the global runtime might have changed
    // so we must update all extensions.
    if (this.rendered) {
      const { runtime: { extensions } } = nextProps
      this.setState({ extensions })
    }
  }

  public componentWillUnmount() {
    const { runtime } = this.props
    const { production, emitter } = runtime
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
    const { history, runtime } = this.props
    const { components, extensions, page, pages, preview, culture, device, route, defaultExtensions } = this.state
    const { account, emitter, hints, production, publicEndpoint, workspace } = runtime

    return {
      account,
      components,
      culture,
      defaultExtensions,
      device,
      emitter,
      ensureSession: this.ensureSession,
      extensions,
      fetchComponent: this.fetchComponent,
      getSettings: this.getSettings,
      hints,
      history,
      navigate: this.navigate,
      onPageChanged: this.onPageChanged,
      page,
      pages,
      patchSession: this.patchSession,
      prefetchDefaultPages: this.prefetchDefaultPages,
      prefetchPage: this.prefetchPage,
      preview,
      production,
      publicEndpoint,
      route,
      setDevice: this.handleSetDevice,
      updateComponentAssets: this.updateComponentAssets,
      updateExtension: this.updateExtension,
      updateRuntime: this.updateRuntime,
      workspace,
    }
  }

  public getSettings = (app: string) => {
    const { settings } = this.state
    return settings[app]
  }

  public ensureSession = () => {
    return this.sessionPromise
  }

  public patchSession = (data?: any) => {
    return this.sessionPromise.then(() => canUseDOM ? window.__RENDER_7_SESSION__.patchSession(data) : undefined)
  }

  public getCustomMessages = (locale: string) => {
    const { components } = this.state
    const componentsArray = Object.keys(components)

    const customMessages = componentsArray
      .map(getImplementation)
      .filter(component => component && (component.getCustomMessages || component.WrappedComponent))
      .map(component => {
        const getCustomMessages = component.getCustomMessages || (component.WrappedComponent && component.WrappedComponent.getCustomMessages) || noop
        return getCustomMessages(locale)
      })
      .reduce((acc, strings) => ({...acc, ...strings}), {})

    return customMessages
  }

  public navigate = (options: NavigateOptions) => {
    const { history } = this.props
    const { pages } = this.state
    return pageNavigate(history, pages, options)
  }

  public replaceRouteClass = (route: string) => {
    try {
      const containers = document.getElementsByClassName(RENDER_CONTAINER_CLASS)
      const currentRouteClass = containers[0].className.split(' ').find(c => c.startsWith(ROUTE_CLASS_PREFIX))
      const newRouteClass = routeClass(route)

      Array.prototype.forEach.call(
        containers,
        (e: Element) => {
          if (currentRouteClass) {
            e.classList.remove(currentRouteClass)
          }
          e.classList.add(newRouteClass)
        }
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

      const options = scrollOptions || { top: 0, left: 0 }
      setTimeout(() => pageScrollTo(options), 0)
    }
    catch (e) {
      console.warn('Failed to scroll after page navigation.')
    }
  }

  public afterPageChanged = (route: string, scrollOptions?: RenderScrollOptions) => {
    this.replaceRouteClass(route)
    this.scrollTo(scrollOptions)
    this.sendInfoFromIframe()
  }

  public onPageChanged = (location: RenderHistoryLocation) => {
    const { runtime: { renderMajor } } = this.props
    const { culture: { locale }, pages: pagesState, production, device, defaultExtensions } = this.state
    const { state } = location

    // Make sure this is our navigation
    if (!state || !state.renderRouting) {
      return
    }

    const { route } = state
    const { id: page, params, path } = route
    const shouldFetchNavigationData = page.startsWith('store') || pagesState[page] && pagesState[page].conditional
    const query = parse(location.search.substr(1))

    if (!shouldFetchNavigationData) {
      return this.setState({
        page,
        query,
        route,
      }, () => this.afterPageChanged(page, state.scrollOptions))
    }

    this.setState({
      extensions: replaceExtensionsWithDefault(this.state.extensions, page, defaultExtensions),
      page,
      preview: true,
      query,
      route
    }, () => {
      this.replaceRouteClass(page)
      this.scrollTo(state.scrollOptions)
    })

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
      params: JSON.stringify(params),
      path,
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
      try {
        if (this.props.history && this.props.history.location.state.route.id !== page) {
          return
        }
      } catch (e) {
        console.error('Failed to access history location state')
      }

      this.setState({
        appsEtag,
        cacheHints,
        components: { ...this.state.components, ...components },
        extensions: { ...this.state.extensions, ...extensions},
        messages: { ...this.state.messages, ...messages },
        page,
        pages,
        preview: false,
        query,
        route,
        settings,
      }, () => this.sendInfoFromIframe())
    })
  }

  public prefetchPage = (pageName: string) => {
    const { extensions } = this.state
    const component = extensions[pageName] && extensions[pageName].component
    if (component) {
      const { runtime } = this.props
      const { components } = this.state
      const { assets } = traverseComponent(components, component)
      return preloadAssets(runtime, assets)
    }
  }

  public prefetchDefaultPages = async (routeIds: string[]) => {
    const { runtime } = this.props
    const { culture: { locale } } = this.state

    const {
      components: defaultComponents,
      extensions: defaultExtensions,
      messages: defaultMessages,
    } = await fetchDefaultPages({
      apolloClient: this.apolloClient,
      locale,
      routeIds
    })

    await Promise.all(Object.keys(defaultComponents).map((component: string) => {
      const { assets } = traverseComponent(defaultComponents, component)
      return preloadAssets(runtime, assets)
    }))

    this.setState(({components, messages}) => ({
      components: {...defaultComponents, ...this.state.components, ...components},
      defaultExtensions,
      messages: {...defaultMessages, ...this.state.messages, ...messages}
    }))
  }

  public updateComponentAssets = (availableComponents: Components) => {
    this.setState({
      components: {
        ...this.state.components,
        ...availableComponents,
      }
    })
  }

  public fetchComponent = (component: string) => {
    if (!canUseDOM) {
      throw new Error('Cannot fetch components during server side rendering.')
    }

    const { runtime } = this.props
    const { components, culture: { locale } } = this.state
    const { apps, assets } = traverseComponent(components, component)
    const unfetchedApps = apps.filter(app => !Object.keys(window.__RENDER_7_COMPONENTS__).some(c => c.startsWith(app)))
    if (unfetchedApps.length === 0) {
      return fetchAssets(runtime, assets)
    }

    const messagesPromises = Promise.all(unfetchedApps.map(app => fetchMessagesForApp(this.apolloClient, app, locale)))
    const assetsPromise = fetchAssets(runtime, assets)
    assetsPromise.then(() => {
      this.sendInfoFromIframe(true)
    })

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
    const { runtime: { renderMajor } } = this.props
    const { page, production, culture: { locale } } = this.state

    // Current locale is one or a subset of the updated ones
    if (locales.indexOf(locale) !== -1 || locales.indexOf(locale.split('-')[0]) !== -1) {
      fetchMessages(this.apolloClient, page, production, locale, renderMajor, true)
        .then(newMessages => {
          this.setState(prevState => ({
            ...prevState,
            messages: { ...prevState.messages, ...newMessages },
          }), () => {
            this.sendInfoFromIframe(true)
          })
        })
        .catch(e => {
          console.log('Failed to fetch new locale file.')
          console.error(e)
        })
    }
  }

  public onLocaleSelected = (locale: string) => {
    const { runtime: { renderMajor } } = this.props
    const { page, production } = this.state

    if (locale !== this.state.culture.locale) {
      createLocaleCookie(locale)
      Promise.all([
        fetchMessages(this.apolloClient, page, production, locale, renderMajor),
        loadLocaleData(locale),
      ])
        .then(([newMessages]) => {
          this.setState(prevState => ({
            ...prevState,
            culture: {
              ...this.state.culture,
              locale,
            },
            messages: { ...prevState.messages, ...newMessages },
          }), () => {
            this.sendInfoFromIframe(true)
          })
        })
        .then(() => window.postMessage({ key: 'cookie.locale', body: { locale } }, '*'))
        .catch(e => {
          console.log('Failed to fetch new locale file.')
          console.error(e)
        })
    }
  }

  public updateRuntime = (options?: PageContextOptions) => {
    const { runtime: { renderMajor } } = this.props
    const { page, production, culture: { locale }, route } = this.state
    const { pathname } = window.location

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
        route,
        settings,
      })
    })
  }

  public createEnsureSessionLink() {
    return new ApolloLink((operation: Operation, forward?: NextLink) =>
      new Observable(observer => {
        let handle: Subscription | undefined
        this.sessionPromise.then(() => {
          handle = forward && forward(operation).subscribe({
            complete: observer.complete.bind(observer),
            error: observer.error.bind(observer),
            next: observer.next.bind(observer),
          })
        }).catch(observer.error.bind(observer))

        return () => {
          if (handle) {
            handle.unsubscribe()
          }
        }
      })
    )
  }

  public createRuntimeContextLink() {
    return new ApolloLink((operation: Operation, forward?: NextLink) => {
      const { appsEtag, cacheHints, components, extensions, messages, pages } = this.state
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
    const { extensions } = this.state

    this.setState({
      extensions: {
        ...extensions,
        [name]: extension,
      },
    }, () => {
      if (name !== 'store/__overlay') {
        this.sendInfoFromIframe()
      }
    })
  }

  public handleSetDevice = (device: ConfigurationDevice) => {
    this.setState({ device })
  }

  public render() {
    const { children } = this.props
    const { culture: { locale }, messages, pages, page, query, production } = this.state
    const customMessages = this.getCustomMessages(locale)
    const mergedMessages = {
      ...messages,
      ...customMessages,
    }

    const component = children
      ? React.cloneElement(children as ReactElement<any>, { query })
      : (
        <div className="render-provider">
          <Helmet title={pages[page] && pages[page].title} />
          <NestedExtensionPoints page={page} query={query} />
        </div>
      )

    const context = this.getChildContext()

    return (
      <RenderContext.Provider value={context}>
        <TreePathContext.Provider value={{ treePath: '' }}>
          <ApolloProvider client={this.apolloClient}>
            <IntlProvider locale={locale} messages={mergedMessages}>
              <Fragment>
                {!production && !isStorefrontIframe && <BuildStatus />}
                {component}
                {isStorefrontIframe ? <ExtensionPoint id="store/__overlay" /> : null}
              </Fragment>
            </IntlProvider>
          </ApolloProvider>
        </TreePathContext.Provider>
      </RenderContext.Provider>
    )
  }
}

export default RenderProvider
