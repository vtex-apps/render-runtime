import {Component, ReactElement} from 'react'

function getExtension(path: string) {
  const result = /\.\w+$/.exec(path)
  return result ? result[0] : ''
}

function addElement (element: HTMLElement, isOverride: boolean) {
  if (isOverride) {
    element.className = 'render_override'
    document.head.appendChild(element)
  } else {
    const override = document.querySelector('.render_override')
    document.head.insertBefore(element, override)
  }
}

export function addScriptToPage (src: string, isOverride: boolean = false): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.onload = () => resolve()
    script.onerror = () => reject()
    script.async = false
    script.src = src
    addElement(script, isOverride)
  })
}

function addStyleToPage(href: string, isOverride: boolean = false) {
  const link = document.createElement('link')
  link.href = href
  link.type = 'text/css'
  link.rel = 'stylesheet'
  addElement(link, isOverride)
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
    const href = document.styleSheets.item(i)!.href
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
  return window.__RENDER_7_COMPONENTS__[component] as RenderComponent<P, S>
}

export function fetchAssets(assets: string[], overrides: string[]) {
  const [scripts, scriptOverrides] = [assets, overrides].map(array => array.filter(shouldAddScriptToPage))
  const [styles, stylesOverrides] = [assets, overrides].map(array => array.filter(shouldAddStyleToPage))

  styles.forEach(style => addStyleToPage(style, false))
  stylesOverrides.forEach(style => addStyleToPage(style, true))

  return Promise.all([
    ...scripts.map(script => addScriptToPage(script, false)),
    ...scriptOverrides.map(script => addScriptToPage(script, true)),
  ]).then(() => { return })
}
