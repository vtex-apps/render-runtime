import { canUseDOM } from 'exenv'
import React, { Fragment, ReactElement } from 'react'
import {createPortal as reactCreatePortal} from 'react-dom'

const portalPattern = /START_SERVER_PORTAL_([^!]+)!((\n|.)+)END_SERVER_PORTAL_\1!/g

// Map `placeholder/with/slashes` to `render-placeholder-with-slashes`.
const hyphenate = (name: string) => name.replace(/\//g, '-')

const portalWrapperId = (name: string) => `render-portal-ssr-${hyphenate(name)}`

const containerId = (name: string) => `render-${hyphenate(name)}`

const renderContainer = (name: string, markup: string) =>
  `<div class="render-container" id="${containerId(name)}">${markup}</div>`

const portalWrapper = (name: string, markup: string) =>
  `<span id="${portalWrapperId(name)}">${markup}</span>`

export const createPortal = (children: ReactElement<any>, name: string, hydrate: boolean) => {
  global.__hasPortals__ = true

  if (!hydrate) {
    return canUseDOM
      ? null
      : <Fragment>{`START_SERVER_PORTAL_${name}!`}{children}{`END_SERVER_PORTAL_${name}!`}</Fragment>
  }

  const ssrPortalContainer = document.getElementById(portalWrapperId(name))
  if (ssrPortalContainer) {
    ssrPortalContainer.remove()
  }

  const container = document.getElementById(containerId(name))
  if (!container) {
    console.warn(`Missing React Portal container div#${containerId(name)}`)
    return null
  }

  return reactCreatePortal(children, container)
}

export const getMarkups = (pageName: string, pageMarkup: string): NamedMarkup[] => {
  const markups: NamedMarkup[] = []

  let matches = global.__hasPortals__ && portalPattern.exec(pageMarkup)
  let strippedMarkup = pageMarkup
  while (matches) {
    const [matched, name, markup] = matches
    strippedMarkup = strippedMarkup.replace(matched, '')
    markups.push({
      markup: renderContainer(name, portalWrapper(name, markup)),
      name
    })
    matches = portalPattern.exec(pageMarkup)
  }

  markups.unshift({
    markup: renderContainer(pageName, strippedMarkup),
    name: pageName,
  })

  return markups
}


export const getContainer = (name: string) => {
  return canUseDOM ? document.getElementById(containerId(name)) : null
}

export const ensureContainer = (name: string) => {
  if (!canUseDOM) {
    return false
  }

  const existingContainer = document.getElementById(containerId(name))
  if (existingContainer) {
    return false
  }

  const containerDiv = document.createElement('div')
  containerDiv.className = 'render-container'
  containerDiv.style.display = 'none'
  containerDiv.id = containerId(name)
  document.body.appendChild(containerDiv)
  return true
}
