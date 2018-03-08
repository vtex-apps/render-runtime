import RouteParser from 'route-parser'
import {canUseDOM} from 'exenv'

function getScore(path) {
  const catchAll = (path.match(/\*/g) || []).length
  const catchOne = (path.match(/:/g) || []).length
  const fixed = (path.match(/\/[\w_-]+/g) || []).length
  return ~((catchAll << 12) + (catchOne << 6) + ((1 << 6) - fixed - 1))
}

function isHost(hostname) {
  return hostname === (canUseDOM ? window.location.hostname : global.__hostname__)
}

function trimEndingSlash(token) {
  return token.replace(/\/$/, '')
}

function createLocationDescriptor (path, {query}) {
  return {
    pathname: path,
    state: {renderRouting: true},
    ...(query && {search: query}),
  }
}

function adjustTemplate (template) {
  // make last splat capture optional
  return trimEndingSlash(template).replace(/(\/\*\w+)$/, '($1)')
}

function pathFromPageName(page, pages, params) {
  const {[page]: pageDescriptor} = pages
  if (!pageDescriptor) {
    console.error(`Page ${page} was not found`)
    return null
  }

  const {path: template} = pageDescriptor
  if (!template) {
    console.error(`Page ${page} has no path`)
    return null
  }

  const properTemplate = adjustTemplate(template)
  return new RouteParser(properTemplate).reverse(params)
}

export function getParams(template, target) {
  const properTemplate = adjustTemplate(template)
  const properTarget = trimEndingSlash(target)
  return new RouteParser(properTemplate).match(properTarget)
}

export function getPagePath(name, pages) {
  const [rootName] = name.split('/')
  const {[rootName]: {path: rootPath, cname}, [name]: {path: pagePath}} = pages

  return cname && isHost(cname)
    ? pagePath && pagePath.substr(rootPath.length)
    : pagePath
}

export function navigate(history, pages, options) {
  let path
  const {page, params, query, to, fallbackToWindowLocation = true} = options

  if (page) {
    path = pathFromPageName(page, pages, params)
  } else if (to) {
    path = to
  } else {
    console.error(`Invalid navigation options. You should use 'page' or 'to' parameters`)
    return false
  }

  if (!path) {
    return false
  }

  if (history) {
    const location = createLocationDescriptor(path, {query})
    history.push(location)
  } else if (fallbackToWindowLocation) {
    window.location.href = `${path}${query}`
  }

  return true
}

export function pageNameFromPath(path, pages) {
  let pageName, score, highScore
  for (const name in pages) {
    const pagePath = getPagePath(name, pages)
    if (pagePath) {
      const matches = !!getParams(pagePath, path)
      if (!matches) {
        continue
      }

      score = getScore(pagePath)
      if (highScore > score) {
        continue
      }

      highScore = score
      pageName = name
    }
  }
  return pageName
}
