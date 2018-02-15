import RouteParser from 'route-parser'

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

export function getParams(template, target) {
  return new RouteParser(template.replace(/\/$/, ''))
    .match(target.replace(/\/$/, ''))
}

export function pageNameFromPath(path, pages) {
  let pageName, score, highScore
  for (const name in pages) {
    const page = pages[name]
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

      score = getScore(page.path)
      if (highScore > score) {
        continue
      }

      highScore = score
      pageName = name
    }
  }
  return pageName
}
