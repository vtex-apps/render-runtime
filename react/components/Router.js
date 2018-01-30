import React, {Component} from 'react'
import PropTypes from 'prop-types'
import RouteParser from 'route-parser'
import {canUseDOM} from 'exenv'
import {Helmet} from 'react-helmet'
import createHistory from 'history/createBrowserHistory'
import {parse} from 'qs'
import ExtensionPoint from '../ExtensionPoint'
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

function shouldAddScriptToPage(path) {
  return isScript(path) && !scriptOnPage(path)
}

function shouldAddStyleToPage(path, idx, arr) {
  return isStyle(path) && !styleOnPage(path) && arr.map(({path: pt}) => pt).indexOf(path) === idx
}

function fetchPage(pageName) {
  const keys = Object.keys(global.__RUNTIME__.extensions)
  const pageExtensions = keys.filter(key => key === pageName || key.startsWith(`${pageName}/`))
  const {scripts, styles} = pageExtensions.reduce((acc, extName) => {
    const extension = global.__RUNTIME__.extensions[extName]
    acc.scripts.push(...extension.assets.filter(shouldAddScriptToPage))
    acc.styles.push(...extension.assets.filter(shouldAddStyleToPage))
    return acc
  }, {scripts: [], styles: []})

  styles.forEach(addStyleToPage)
  return Promise.all(scripts.map(addScriptToPage))
}

export function prefetchPage(pageName) {
  if (canUseDOM) {
    fetchPage(pageName)
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

    this.state = {page: context.page}
    this.changePage = this.changePage.bind(this)
    this.fillPageParams = this.fillPageParams.bind(this)
    this.pageNameFromPath = this.pageNameFromPath.bind(this)

    this.fillPageParams()
  }

  componentDidMount() {
    this._isMounted = true
    this.unlisten = global.browserHistory.listen(this.changePage)
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

  pageNameFromPath(path) {
    let pageName, score, highScore
    for (const name in global.__RUNTIME__.pages) {
      const page = global.__RUNTIME__.pages[name]
      if (page.path) {
        const matches = !!getParams(page.path, path)
        if (!matches) {
          // We have to admit `/admin/*slug` matches `/admin`
          if (!/\/\*.*$/.test(page.path)) {
            continue
          }
          const withoutLastSegment = removeSegment(page.path)
          const matchesWithoutSlug = !!getParams(withoutLastSegment, path)
          if (!matchesWithoutSlug) {
            continue
          }
        }

        score = this.getScore(page.path)
        if (highScore > score) {
          continue
        }

        highScore = score
        pageName = name
      }
    }
    return pageName
  }

  fillPageParams() {
    const path = canUseDOM ? window.location.pathname : global.__pathname__
    let pageName = this.pageNameFromPath(path)

    while (pageName && pageName !== '') {
      const page = global.__RUNTIME__.pages[pageName]
      const allParams = getParams(page.path, path)

      // Filter out params not owned by this page
      const paramNames = Object.keys(
        getParams(page.path, page.path)
      )
      const params = {}
      paramNames.forEach(name => {
        params[name] = allParams[name]
      })

      page.params = params
      pageName = removeSegment(pageName)
    }
  }

  changePage(location) {
    const path = location.pathname
    const page = this.pageNameFromPath(path)
    if (!page) {
      throw new Error(`No pages matched the requested path: ${path}`)
    }

    // Change page info in context
    global.__RUNTIME__.page = page
    global.__RUNTIME__.query = parse(location.search.substr(1))

    // Add found URL params to extension settings (e.g. :slug).
    this.fillPageParams()

    document.body.scrollTop = 0
    fetchPage(page).then(() => this._isMounted && this.setState({page}))
  }

  render() {
    const {account} = this.context
    const {page} = this.state
    const {settings} = global.__RUNTIME__.extensions[page]
    return (
      <div>
        <Helmet title={settings ? settings.title || account : account} />
        {nestPages(page.split('/'))}
        <IntrospectionFetcher />
      </div>
    )
  }
}

const nestPages = treePathSegments => {
  return treePathSegments.reverse().reduce((acc, value) => {
    return <ExtensionPoint id={value}>{acc}</ExtensionPoint>
  }, null)
}

Router.contextTypes = {
  account: PropTypes.string,
  page: PropTypes.string,
}
