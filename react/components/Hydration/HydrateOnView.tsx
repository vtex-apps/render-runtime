import React, { useEffect, useState, FC, useRef, MutableRefObject } from 'react'
import PreventHydration from './PreventHydration'
import { useDehydratedContent } from '../../hooks/hydration'

interface Props {
  treePath: string
}

const useViewDetection = ({
  ref,
  bailOut,
}: {
  ref: MutableRefObject<HTMLElement | null>
  bailOut?: boolean
}) => {
  const hasInitializedObserver = useRef(false)
  const [hasBeenViewed, setHasBeenViewed] = useState(false)

  const handleMouseOver = () => {
    setHasBeenViewed(true)
  }

  useEffect(() => {
    const element = ref.current

    if (
      bailOut ||
      !element || // has no ref to the container for some reason, so bails out
      hasBeenViewed || // ¯\_(ツ)_/¯
      hasInitializedObserver.current // has already started observing the container
    ) {
      return
    }

    const initializeObserver = () => {
      hasInitializedObserver.current = true

      new IntersectionObserver(([entry], observer) => {
        if (!entry.isIntersecting) {
          return
        }

        observer.unobserve(element)
        setHasBeenViewed(true)
      }).observe(element)
    }

    // Only initializes view detection after user interaction
    const handleScroll = () => {
      initializeObserver()
      window?.document?.removeEventListener('scroll', handleScroll)
    }

    window?.document?.addEventListener('scroll', handleScroll)
    /** If somehow the user interacts with the element but `hasBeenViewed` was false,
     * sets it to true. */
    element.addEventListener('mouseover', handleMouseOver)

    return () => {
      window?.document?.removeEventListener('scroll', handleScroll)
      element.addEventListener('mouseover', handleMouseOver)
    }
  }, [bailOut, hasBeenViewed, ref])

  return { hasBeenViewed }
}

const HydrateOnView: FC<Props> = ({ children, treePath }) => {
  const containerRef = useRef<HTMLElement | null>(null)

  const { hasRenderedOnServer } = useDehydratedContent(treePath)

  const { hasBeenViewed } = useViewDetection({
    ref: containerRef,
    bailOut: !hasRenderedOnServer,
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
