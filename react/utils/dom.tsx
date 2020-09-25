import { canUseDOM } from 'exenv'
import React, { Fragment, ReactElement, ReactPortal } from 'react'
import { createPortal as reactCreatePortal } from 'react-dom'
import { NamedMarkup } from '../typings/global'

const portalPattern = /START_SERVER_PORTAL_([^!]+)!((\n|.)+)END_SERVER_PORTAL_\1!/g

// Map `placeholder/with/slashes` to `render-placeholder-with-slashes`.
const hyphenate = (name: string) => name.replace(/[^\w]/g, '-')

const portalWrapperId = (name: string) => `render-portal-ssr-${hyphenate(name)}`

export const RENDER_CONTAINER_CLASS = 'render-container'

export const ROUTE_CLASS_PREFIX = 'render-route-'

export const routeClass = (name: string) =>
  `${ROUTE_CLASS_PREFIX}${hyphenate(name)}`

const renderContainer = (name: string, markup: string) =>
  `<div class="${RENDER_CONTAINER_CLASS} ${routeClass(name)}">${markup}</div>`

const portalWrapper = (name: string, markup: string) =>
  `<span id="${portalWrapperId(name)}">${markup}</span>`

export const createPortal = (
  children: ReactElement<any>,
  name: string,
  hydrate: boolean
) => {
  window.__hasPortals__ = true

  if (!hydrate) {
    return canUseDOM ? null : (
      <Fragment>
        {`START_SERVER_PORTAL_${name}!`}
        {children}
        {`END_SERVER_PORTAL_${name}!`}
      </Fragment>
    )
  }

  const ssrPortalContainer = document.getElementById(portalWrapperId(name))
  if (ssrPortalContainer) {
    ssrPortalContainer.remove()
  }

  const container = document.getElementsByClassName(routeClass(name))[0]
  if (!container) {
    console.warn(`Missing React Portal container div.${routeClass(name)}`)
    return null
  }

  return reactCreatePortal(children, container) as ReactPortal
}

export const getMarkups = (
  pageName: string,
  pageMarkup: string
): NamedMarkup[] => {
  const markups: NamedMarkup[] = []

  let matches = window.__hasPortals__ && portalPattern.exec(pageMarkup)
  let strippedMarkup = pageMarkup
  while (matches) {
    const [matched, name, markup] = matches
    strippedMarkup = strippedMarkup.replace(matched, '')
    markups.push({
      markup: renderContainer(name, portalWrapper(name, markup)),
      name,
    })
    matches = portalPattern.exec(pageMarkup)
  }

  markups.unshift({
    markup: renderContainer(pageName, strippedMarkup),
    name: pageName,
  })

  return markups
}

const checkIsSiteEditorIframe = () => {
  try {
    return (
      canUseDOM &&
      window.top !== window.self &&
      window.top.__provideRuntime &&
      !!window.top.__provideRuntime &&
      window.__RUNTIME__.route.domain === 'store'
    )
  } catch {
    return false
  }
}

export const isSiteEditorIframe = checkIsSiteEditorIframe()

export const getOrCreateContainer = () => {
  if (!canUseDOM) {
    throw new Error('Should not try to get container on server side')
  }

  const existingContainer = document.getElementsByClassName(
    RENDER_CONTAINER_CLASS
  )[0]

  if (existingContainer) {
    return { container: existingContainer, created: false }
  }

  const containerDiv = document.createElement('div')
  containerDiv.className = `render-container ${routeClass(name)}`
  containerDiv.style.display = 'none'
  document.body.appendChild(containerDiv)
  return { container: containerDiv, created: true }
}
