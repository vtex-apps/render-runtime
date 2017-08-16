import React, {Component} from 'react'
import PropTypes from 'prop-types'
import RouteParser from 'route-parser'
import {canUseDOM} from 'exenv'
import {Helmet} from 'react-helmet'
import createHistory from 'history/createBrowserHistory'
import {parse} from 'qs'
import Placeholder from './components/Placeholder'
import state from './state'
import IntrospectionFetcher from './components/IntrospectionFetcher'

const {hash} = state

function addHashQueryString (path) {
  return `${path}?hash=${hash}`
}

function isRelative (path) {
  return path[0] !== '/'
}

function prefix (path) {
  const prefix = isRelative(path) ? '/assets/' : ''
  return `${prefix}${path}`
}

function getExtension (path) {
  return /\.\w+$/.exec(path)[0]
}

function addScriptToPage (src) {
  return new Promise ((resolve, reject) => {
    const script = document.createElement('script')
    script.src = prefix(addHashQueryString(src))
    script.onload = resolve
    script.onerror = reject
    script.async = false
    document.head.appendChild(script)
  })
}

function addStyleToPage (href) {
  const link = document.createElement('link')
  link.href = prefix(addHashQueryString(href))
  link.type = 'text/css'
  link.rel = 'stylesheet'
  document.head.appendChild(link)
}

function getExistingScriptSrcs () {
  const paths = []
  for (let i = 0; i < document.scripts.length; i++) {
    paths.push(document.scripts.item(i).src)
  }
  return paths
}

function getExistingStyleHrefs () {
  const hrefs = []
  for (let i = 0; i < document.styleSheets.length; i++) {
    const href = document.styleSheets.item(i).href
    href && hrefs.push(href)
  }
  return hrefs
}

function scriptOnPage (path) {
  return getExistingScriptSrcs()
    .some(src => src.indexOf(path) !== -1)
}

function styleOnPage (path) {
  return getExistingStyleHrefs()
    .some(href => href.indexOf(path) !== -1)
}

function isScript (path) {
  return getExtension(path) === '.js'
}

function isStyle (path) {
  return getExtension(path) === '.css'
}

function shouldAddScriptToPage ({ path, serverOnly }) {
  return !serverOnly && isScript(path) && !scriptOnPage(path)
}

function shouldAddStyleToPage ({ path, serverOnly }) {
  return !serverOnly && isStyle(path) && !styleOnPage(path)
}

function fetchRoute (routeName) {
  const placeholder = global.__RUNTIME__.placeholders[routeName]
  const scriptsToBeAdded = placeholder.assets.filter(shouldAddScriptToPage)
    .map(({path}) => path)
  const stylesToBeAdded = placeholder.assets.filter(shouldAddStyleToPage)
    .map(({path}) => path)
  stylesToBeAdded.forEach(addStyleToPage)
  return Promise.all(
    scriptsToBeAdded.map(addScriptToPage)
  )
}

export function prefetchRoute (routeName) {
  if (canUseDOM) {
    fetchRoute(routeName)
  }
}

if (canUseDOM) {
  global.browserHistory = createHistory()
}

export class Route extends Component {
  constructor (props, context) {
    super(props, context)
    this.state = {route: context.route}
    this.changeRoute = this.changeRoute.bind(this)
    this.resolveRoute = this.resolveRoute.bind(this)
  }

  componentDidMount () {
    this._isMounted = true
    this.unlisten = global.browserHistory.listen(this.changeRoute)
  }

  componentWillUnmount () {
    this._isMounted = false
    this.unlisten()
  }

  getScore (path) {
    const catchAll = (path.match(/\*/g) || []).length
    const catchOne = (path.match(/:/g) || []).length
    const fixed = (path.match(/\/[\w_-]+/g) || []).length
    return ~((catchAll << 12) + (catchOne << 6) + ((1 << 6) - fixed - 1))
  }

  resolveRoute (path) {
    let params, route, score, highScore
    for (const name in global.__RUNTIME__.placeholders) {
      const placeholder = global.__RUNTIME__.placeholders[name]
      if (placeholder.path) {
        const tempParams = new RouteParser(placeholder.path.replace(/\/$/, '')).match(path.replace(/\/$/, ''))
        if (!tempParams) {
          continue
        }

        score = this.getScore(placeholder.path)
        if (highScore > score) {
          continue
        }

        highScore = score
        route = name
        params = tempParams
      }
    }
    return {params, route}
  }

  changeRoute (location) {
    const {params, route} = this.resolveRoute(location.pathname)
    if (!params) {
      throw new Error('No routes matched the requested path')
    }

    // Change route info in context
    global.__RUNTIME__.route = route
    global.__RUNTIME__.query = parse(location.search.substr(1))

    // Add found URL params to placeholder settings (e.g. :slug).
    global.__RUNTIME__.placeholders[route].params = params

    document.body.scrollTop = 0
    fetchRoute(route).then(() => this._isMounted && this.setState({route}))
  }

  render () {
    const {account} = this.context
    const {route} = this.state
    const {settings} = global.__RUNTIME__.placeholders[route]
    return (
      <div>
        <Helmet title={settings ? (settings.title || account) : account} />
        <Placeholder id={route} />
        <IntrospectionFetcher />
      </div>
    )
  }
}

Route.contextTypes = {
  account: PropTypes.string,
  route: PropTypes.string,
}
