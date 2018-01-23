import React, {Component} from 'react'
import PropTypes from 'prop-types'
import RouteParser from 'route-parser'
import {canUseDOM} from 'exenv'
import {Helmet} from 'react-helmet'
import createHistory from 'history/createBrowserHistory'
import {parse} from 'qs'
import ExtensionPoint from './ExtensionPoint'
import IntrospectionFetcher from './IntrospectionFetcher'

function isRelative(path) {
  return path[0] !== '/'
}

function prefix(path) {
  const prefix = isRelative(path) ? '/assets/' : ''
  return `${prefix}${path}`
}

function getExtension(path) {
  return /\.\w+$/.exec(path)[0]
}

function getParams(template, target) {
  return new RouteParser(template.replace(/\/$/, ''))
    .match(target.replace(/\/$/, ''))
}

function addScriptToPage(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = prefix(src)
    script.onload = resolve
    script.onerror = reject
    script.async = false
    document.head.appendChild(script)
  })
}

function addStyleToPage(href) {
  const link = document.createElement('link')
  link.href = prefix(href)
  link.type = 'text/css'
  link.rel = 'stylesheet'
  document.head.appendChild(link)
}

function getExistingScriptSrcs() {
  const paths = []
  for (let i = 0; i < document.scripts.length; i++) {
    paths.push(document.scripts.item(i).src)
  }
  return paths
}

function getExistingStyleHrefs() {
  const hrefs = []
  for (let i = 0; i < document.styleSheets.length; i++) {
    const href = document.styleSheets.item(i).href
    href && hrefs.push(href)
  }
  return hrefs
}

function scriptOnPage(path) {
  return getExistingScriptSrcs().some(src => src.indexOf(path) !== -1)
}

function styleOnPage(path) {
  return getExistingStyleHrefs().some(href => href.indexOf(path) !== -1)
}

function isScript(path) {
  return getExtension(path) === '.js'
}

function isStyle(path) {
  return getExtension(path) === '.css'
}

function shouldAddScriptToPage({path, serverOnly}) {
  return !serverOnly && isScript(path) && !scriptOnPage(path)
}

function shouldAddStyleToPage(asset, idx, arr) {
  const {path, serverOnly} = asset
  return !serverOnly && isStyle(path) && !styleOnPage(path) && arr.map(({path: pt}) => pt).indexOf(path) === idx
}

function fetchRoute(routeName) {
  const placeholder = global.__RUNTIME__.placeholders[routeName]
  const scriptsToBeAdded = placeholder.assets
    .filter(shouldAddScriptToPage)
    .map(({path}) => path)
  const stylesToBeAdded = placeholder.assets
    .filter(shouldAddStyleToPage)
    .map(({path}) => path)
  stylesToBeAdded.forEach(addStyleToPage)
  return Promise.all(scriptsToBeAdded.map(addScriptToPage))
}

export function prefetchRoute(routeName) {
  if (canUseDOM) {
    fetchRoute(routeName)
  }
}

if (canUseDOM) {
  global.browserHistory = createHistory()
}

function removeSegment(name) {
  const segments = name.split('/')
  segments.pop()
  return segments.join('/')
}

export class Router extends Component {
  constructor(props, context) {
    super(props, context)

    this.state = {route: context.route}
    this.changeRoute = this.changeRoute.bind(this)
    this.fillRouteParams = this.fillRouteParams.bind(this)
    this.placeholderNameFromPath = this.placeholderNameFromPath.bind(this)

    this.fillRouteParams()
  }

  componentDidMount() {
    this._isMounted = true
    this.unlisten = global.browserHistory.listen(this.changeRoute)
  }

  componentWillUnmount() {
    this._isMounted = false
    this.unlisten()
  }

  getScore(path) {
    const catchAll = (path.match(/\*/g) || []).length
    const catchOne = (path.match(/:/g) || []).length
    const fixed = (path.match(/\/[\w_-]+/g) || []).length
    return ~((catchAll << 12) + (catchOne << 6) + ((1 << 6) - fixed - 1))
  }

  placeholderNameFromPath(path) {
    let route, score, highScore
    for (const name in global.__RUNTIME__.placeholders) {
      const placeholder = global.__RUNTIME__.placeholders[name]
      if (placeholder.path) {
        const matches = !!getParams(placeholder.path, path)
        if (!matches) {
          // We have to admit `/admin/*slug` matches `/admin`
          if (!/\/\*.*$/.test(placeholder.path)) {
            continue
          }
          const withoutLastSegment = removeSegment(placeholder.path)
          const matchesWithoutSlug = !!getParams(withoutLastSegment, path)
          if (!matchesWithoutSlug) {
            continue
          }
        }

        score = this.getScore(placeholder.path)
        if (highScore > score) {
          continue
        }

        highScore = score
        route = name
      }
    }
    return route
  }

  fillRouteParams() {
    const path = canUseDOM ? window.location.pathname : global.__pathname__
    let route = this.placeholderNameFromPath(path)

    while (route && route !== '') {
      const placeholder = global.__RUNTIME__.placeholders[route]
      const allParams = getParams(placeholder.path, path)

      // Filter out params not owned by this route
      const paramNames = Object.keys(
        getParams(placeholder.relativePath, placeholder.relativePath)
      )
      const params = {}
      paramNames.forEach(name => {
        params[name] = allParams[name]
      })

      placeholder.params = params
      route = removeSegment(route)
    }
  }

  changeRoute(location) {
    const path = location.pathname
    const route = this.placeholderNameFromPath(path)
    if (!route) {
      throw new Error(`No routes matched the requested path: ${path}`)
    }

    // Change route info in context
    global.__RUNTIME__.route = route
    global.__RUNTIME__.query = parse(location.search.substr(1))

    // Add found URL params to placeholder settings (e.g. :slug).
    this.fillRouteParams()

    document.body.scrollTop = 0
    fetchRoute(route).then(() => this._isMounted && this.setState({route}))
  }

  render() {
    const {account} = this.context
    const {route} = this.state
    const {settings} = global.__RUNTIME__.placeholders[route]
    return (
      <div>
        <Helmet title={settings ? settings.title || account : account} />
        {nestRoutes(route.split('/'))}
        <IntrospectionFetcher />
      </div>
    )
  }
}

const nestRoutes = treePathSegments => {
  return treePathSegments.reverse().reduce((acc, value) => {
    return <ExtensionPoint id={value}>{acc}</ExtensionPoint>
  }, null)
}

Router.contextTypes = {
  account: PropTypes.string,
  route: PropTypes.string,
}
