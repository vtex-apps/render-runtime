import React, { useState, FC, useRef, MutableRefObject } from 'react'
import PreventHydration from './PreventHydration'
import { useDehydratedContent } from '../../hooks/hydration'
import { useOnView } from '../../hooks/viewDetection'

interface Props {
  treePath: string
}

const HydrateOnView: FC<Props> = ({ children, treePath }) => {
  const containerRef = useRef<HTMLElement | null>(null)
  const [hasBeenViewed, setHasBeenViewed] = useState(false)

  const { hasRenderedOnServer } = useDehydratedContent(treePath)

  useOnView({
    ref: containerRef,
    once: true,
    initializeOnInteraction: true,
    bailOut: !hasRenderedOnServer || hasBeenViewed,
    onView: () => {
      setHasBeenViewed(true)
    },
  })

  return (
    <div ref={containerRef as MutableRefObject<HTMLDivElement>}>
      <PreventHydration
        shouldHydrate={hasBeenViewed || !hasRenderedOnServer}
        treePath={treePath}
      >
        {children}
      </PreventHydration>
    </div>
  )
}

export default HydrateOnView
