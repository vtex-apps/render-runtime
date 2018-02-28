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

export function getParams(template, target) {
  // make last splat capture optional
  const properTemplate = trimEndingSlash(template).replace(/(\/\*\w+)$/, '($1)')
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
