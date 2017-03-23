import React, {Component, PropTypes} from 'react'
import RouteParser from 'route-parser'
import {canUseDOM} from 'exenv'
import Helmet from 'react-helmet'
import createHistory from 'history/createBrowserHistory'
import Placeholder from './components/Placeholder'
import state from './state'

const {hash} = state
const {placeholders} = global.__RUNTIME__

function fetchRoute (routeName) {
  // Check if route bundle is already loaded in page
  if (document.getElementById(routeName) && document.getElementById(`${routeName}CSS`)) {
    return Promise.resolve()
  }
  return new Promise((resolve, reject) => {
    const bundlePath = `/assets/${routeName}.js${hash ? `?hash=${hash}` : ''}`
    const cssPath = `/assets/${routeName}.css${hash ? `?hash=${hash}` : ''}`

    const link = document.createElement('link')
    link.href = cssPath
    link.id = `${routeName}CSS`
    link.type = 'text/css'
    link.rel = 'stylesheet'
    document.head.appendChild(link)

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

// eslint-disable-next-line
export class Route extends Component {
  constructor (props, context) {
    super(props, context)
    this.state = {route: context.route}
    this.changeRoute = this.changeRoute.bind(this)
    this.resolveRoute = this.resolveRoute.bind(this)
  }

  componentDidMount () {
    global.browserHistory = createHistory()
    global.browserHistory.listen(this.changeRoute)
  }

  getScore (path) {
    const catchAll = (path.match(/\*/g) || []).length
    const catchOne = (path.match(/:/g) || []).length
    const fixed = (path.match(/\/[\w_-]+/g) || []).length
    return ~((catchAll << 12) + (catchOne << 6) + ((1 << 6) - fixed - 1))
  }

  resolveRoute (path) {
    let params, route, score, highScore
    for (const name in placeholders) {
      const placeholder = placeholders[name]
      if (placeholder.path) {
        const tempParams = new RouteParser(placeholder.path).match(path)
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

    // Add found URL params to placeholder settings (e.g. :slug).
    placeholders[route].settings = {
      ...placeholders[route].settings,
      ...params,
    }
    document.body.scrollTop = 0
    fetchRoute(route).then(() => this.setState({route}))
  }

  render () {
    const {account} = this.context
    const {route} = this.state
    const {settings} = placeholders[route]
    return (
      <div>
        <Helmet title={settings ? (settings.title || account) : account} />
        <Placeholder id={route} />
      </div>
    )
  }
}

Route.contextTypes = {
  account: PropTypes.string,
  route: PropTypes.string,
}
