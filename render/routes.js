import React, {Component, PropTypes} from 'react'
import RouteParser from 'route-parser'
import {canUseDOM} from 'exenv'
import Helmet from 'react-helmet'
import createHistory from 'history/createBrowserHistory'
import {parse} from 'qs'
import Placeholder from './components/Placeholder'
import state from './state'
import IntrospectionFetcher from './components/IntrospectionFetcher'

const {hash} = state

function fetchRoute (routeName) {
  // Check if route bundle is already loaded in page
  if (document.getElementById(routeName) && document.getElementById(`${routeName}CSS`)) {
    return Promise.resolve()
  }
  return new Promise((resolve, reject) => {
    const bundlePath = `/assets/${routeName}.js${hash ? `?hash=${hash}` : ''}`
    const cssPath = `/assets/${routeName}.css${hash ? `?hash=${hash}` : ''}`

    if (!module.hot) {
      const link = document.createElement('link')
      link.href = cssPath
      link.id = `${routeName}CSS`
      link.type = 'text/css'
      link.rel = 'stylesheet'
      document.head.appendChild(link)
    }

    const script = document.createElement('script')
    script.src = bundlePath
    script.id = routeName
    script.onload = resolve
    script.onerror = reject
    document.head.appendChild(script)
  })
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
    this.unlisten = global.browserHistory.listen(this.changeRoute)
  }

  componentWillUnmount () {
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
    fetchRoute(route).then(() => this.setState({route}))
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
