import React, { FunctionComponent, useRef, useState } from 'react'
import { useOnView } from '../hooks/viewDetection'

interface Props {
  height?: number
  offset?: number
  debug?: boolean
}

const LazyRender: FunctionComponent<Props> = ({
  children,
  height = 300,
  offset = 300,
  debug = false,
}) => {
  const ref = useRef(null)
  const [hasBeenViewed, setHasBeenViewed] = useState(false)

  useOnView({
    ref,
    onView: () => {
      setHasBeenViewed(true)
      if (debug) {
        console.log('ViewDetector has been viewed')
      }
    },
    once: true,
    initializeOnInteraction: true,
  })

  if (hasBeenViewed) {
    return <>{children}</>
  }

  return (
    <div
      ref={ref}
      style={{
        position: 'relative',
        width: '100%',
        height,
        border: debug ? '1px solid red' : undefined,
      }}
    >
      <div
        style={{
          position: 'absolute',
          width: '100%',
          top: -offset,
          bottom: -offset,
          border: debug ? '1px dotted red' : undefined,
        }}
      />
    </div>
  )
}

export default LazyRender
