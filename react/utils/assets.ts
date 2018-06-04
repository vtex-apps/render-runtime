import {Component, ReactElement} from 'react'

function getExtension(path: string) {
  const result = /\.\w+$/.exec(path)
  return result ? result[0] : ''
}

export function addScriptToPage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.onload = () => resolve()
    script.onerror = () => reject()
    script.async = false
    script.src = src
    document.head.appendChild(script)
  })
}

function addStyleToPage(href: string) {
  const link = document.createElement('link')
  link.href = href
  link.type = 'text/css'
  link.rel = 'stylesheet'
  document.head.appendChild(link)
}

function getExistingScriptSrcs() {
  const paths: string[] = []
  for (let i = 0; i < document.scripts.length; i++) {
    paths.push(document.scripts.item(i).src)
  }
  return paths
}

function getExistingStyleHrefs() {
  const hrefs: string[] = []
  for (let i = 0; i < document.styleSheets.length; i++) {
    const href = document.styleSheets.item(i).href
    if (href) {
      hrefs.push(href)
    }
  }
  return hrefs
}

function scriptOnPage(path: string) {
  return getExistingScriptSrcs().some(src => src.indexOf(path) !== -1)
}

function styleOnPage(path: string) {
  return getExistingStyleHrefs().some(href => href.indexOf(path) !== -1)
}

function isScript(path: string) {
  return getExtension(path) === '.js'
}

function isStyle(path: string) {
  return getExtension(path) === '.css'
}

export function shouldAddScriptToPage(path: string) {
  return isScript(path) && !scriptOnPage(path)
}

function shouldAddStyleToPage(path: string) {
  return isStyle(path) && !styleOnPage(path)
}

export function getImplementation<P={}, S={}>(component: string) {
  return global.__RENDER_7_COMPONENTS__[component] as new() => Component<P, S>
}

export function fetchAssets(assets: string[]) {
  const scripts = assets.filter(shouldAddScriptToPage)
  const styles = assets.filter(shouldAddStyleToPage)
  styles.forEach(addStyleToPage)
  return Promise.all(scripts.map(addScriptToPage)).then(() => { return })
}
