import {canUseDOM} from 'exenv'
import React from 'react'
import {render} from 'preact-compat'
import {renderToString} from 'preact-compat/server'
import PlaceholderProvider from '../components/PlaceholderProvider'
import Placeholder from '../components/Placeholder'

export default function ({placeholders}) {
  const parentId = Object.keys(placeholders)[0].split('/')[0]

  // Render only Placeholders with no parent. e.g. "test/render" might be declared in "test"
  const shouldRender = (name) => !Object.keys(placeholders).find((p) => name.indexOf(p) === 0 && p !== name)

  const createPlaceholder = ({name}) => shouldRender(name) && <Placeholder id={name} />

  const createPlaceholderProvider = () =>
    <PlaceholderProvider placeholders={placeholders}>
      <div>
        {Object.values(placeholders).map(createPlaceholder)}
      </div>
    </PlaceholderProvider>

  if (canUseDOM) {
    try {
      render(createPlaceholderProvider(), document.getElementById(parentId))
      console.log('Welcome to Render! Want to look under the hood? http://lab.vtex.com/careers/')
    } catch (e) {
      console.log('Oops!')
      console.error(e)
    }
  } else {
    const markup = `<div id="${parentId}">${renderToString(createPlaceholderProvider())}</div>`

    global.rendered = {
      markup,
    }
  }
}
