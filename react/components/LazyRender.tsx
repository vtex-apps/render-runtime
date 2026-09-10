import React, { FunctionComponent, useEffect, useRef, useState } from 'react'
import { useOnView } from '../hooks/viewDetection'

interface Props {
  height?: number
  offset?: number
  debug?: boolean
}

const LazyRender: FunctionComponent<Props> = ({
  children,
  height = 400,
  offset = 300,
}) => {
  const ref = useRef(null)
  const [hasBeenViewed, setHasBeenViewed] = useState(false)

  // When enableAsyncScripts is active, window.__ASYNC_SCRIPTS_READY__ starts as
  // false and flips to true (dispatching "asyncScriptsReady") only after every
  // bundle in the async queue has run. If we let the IntersectionObserver fire
  // while bundles are still executing, lazy components may try to require()
  // modules whose webpack chunk hasn't been registered yet, causing
  // "Object(...) is not a function" / React error #130.
  const [asyncReady, setAsyncReady] = useState(() => {
    if (typeof window === 'undefined') return true
    if (typeof window.__ASYNC_SCRIPTS_READY__ === 'undefined') return true
    return window.__ASYNC_SCRIPTS_READY__ === true
  })

  useEffect(() => {
    if (asyncReady) return

    const onReady = () => setAsyncReady(true)

    window.addEventListener('asyncScriptsReady', onReady)

    // Guard against the event having fired between the render and this effect
    if (window.__ASYNC_SCRIPTS_READY__) {
      setAsyncReady(true)
    }

    return () => window.removeEventListener('asyncScriptsReady', onReady)
  }, [asyncReady])

  useOnView({
    ref,
    onView: () => {
      setHasBeenViewed(true)
    },
    once: true,
    initializeOnInteraction: true,
    bailOut: !asyncReady,
  })

  if (hasBeenViewed) {
    return <>{children}</>
  }

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height,
      }}
      className="vtex-render__lazy-container"
    >
      <div
        ref={ref}
        style={{
          position: 'relative',
          width: '100%',
          top: -offset,
          height: '100%',
          paddingBottom: offset * 2,
          boxSizing: 'content-box',
        }}
      />
    </div>
  )
}

export default LazyRender
