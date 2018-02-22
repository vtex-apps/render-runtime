import RouteParser from 'route-parser'
import {canUseDOM} from 'exenv'

function removeSegment(name) {
  const segments = name.split('/')
  segments.pop()
  return segments.join('/')
}

function getScore(path) {
  const catchAll = (path.match(/\*/g) || []).length
  const catchOne = (path.match(/:/g) || []).length
  const fixed = (path.match(/\/[\w_-]+/g) || []).length
  return ~((catchAll << 12) + (catchOne << 6) + ((1 << 6) - fixed - 1))
}

function isHost(hostname) {
  return hostname === (canUseDOM ? window.location.hostname : global.__hostname__)
}

export function getParams(template, target) {
  return new RouteParser(template.replace(/\/$/, ''))
    .match(target.replace(/\/$/, ''))
}

export function getPagePath(name, pages) {
  const [rootName] = name.split('/')
  const {[rootName]: {path: rootPath, cname}, [name]: {path: pagePath}} = pages

  return cname && isHost(cname)
    ? pagePath && pagePath.substr(rootPath.length)
    : pagePath
}

export function pageNameFromPath(path, pages) {
  let pageName, score, highScore
  for (const name in pages) {
    const pagePath = getPagePath(name, pages)
    if (pagePath) {
      const matches = !!getParams(pagePath, path)
      if (!matches) {
        // We have to admit `/admin/*slug` matches `/admin`
        if (!/\/\*.*$/.test(pagePath)) {
          continue
        }
        const withoutLastSegment = removeSegment(pagePath)
        const matchesWithoutSlug = !!getParams(withoutLastSegment, path)
        if (!matchesWithoutSlug) {
          continue
        }
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
