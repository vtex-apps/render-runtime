function getExtension(path) {
  return /\.\w+$/.exec(path)[0]
}

export function addScriptToPage(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = src
    script.onload = resolve
    script.onerror = reject
    script.async = false
    document.head.appendChild(script)
  })
}

function addStyleToPage(href) {
  const link = document.createElement('link')
  link.href = href
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

export function shouldAddScriptToPage(path) {
  return isScript(path) && !scriptOnPage(path)
}

function shouldAddStyleToPage(path, idx, arr) {
  return isStyle(path) && !styleOnPage(path) && arr.map(({path: pt}) => pt).indexOf(path) === idx
}

export function getImplementation(component) {
  return global.__RENDER_6_COMPONENTS__[component]
}

export function fetchAssets(assets) {
  const scripts = assets.filter(shouldAddScriptToPage)
  const styles = assets.filter(shouldAddStyleToPage)
  styles.forEach(addStyleToPage)
  return Promise.all(scripts.map(addScriptToPage))
}
