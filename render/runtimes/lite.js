import {canUseDOM} from 'exenv'
import React from 'react'
import {render} from 'preact-compat'
import {renderToString} from 'preact-compat/server'
import state from '../state'
import Placeholder from '../components/Placeholder'

const {placeholders, route} = state
const containerId = (name) => `render-${name.replace(/\//g, '-')}`
// Render only self and children, and only if they have a component.
const shouldRender = (k, placeholders) => RegExp(`^${route}($|/.+)`).test(k) && placeholders[k].component

if (canUseDOM) {
  window.global = window
  try {
    Object.keys(placeholders).forEach(function (k) {
      if (shouldRender(k, placeholders)) {
        render(<Placeholder id={k} />, document.getElementById(containerId(k)))
      }
    })
    console.log('Welcome to Render! Want to look under the hood? http://lab.vtex.com/careers/')
  } catch (e) {
    console.log('Oops!')
    console.error(e)
  }
} else {
  const markup = Object.keys(placeholders).reduce(function (acc, k) {
    if (shouldRender(k, placeholders)) {
      acc[k] = `<div id="${containerId(k)}">${renderToString(<Placeholder id={k} />)}</div>`
    }
    return acc
  }, {})

  global.rendered = {
    head: {
      title: '',
      meta: '',
      link: '',
    },
    markup,
  }
}
