import React, { FunctionComponent, useRef, useState } from 'react'
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

  useOnView({
    ref,
    onView: () => {
      setHasBeenViewed(true)
    },
    once: true,
    initializeOnInteraction: true,
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
