import React, { useEffect, useState, FC, useRef, MutableRefObject } from 'react'
import PreventHydration from './PreventHydration'

interface Props {
  id: string
  loading?: boolean
}

const ON_VIEW_DELAY = 500

const useViewDetection = ({
  ref,
  bailOut,
}: {
  ref: MutableRefObject<HTMLElement | null | undefined>
  bailOut?: boolean
}) => {
  const hasInitializedObserver = useRef(false)
  const [hasBeenViewed, setHasBeenViewed] = useState(false)
  const viewTimeout = useRef<null | number>(null)

  useEffect(() => {
    if (
      bailOut ||
      !ref.current || // has no ref to the container for some reason, so bails out
      hasInitializedObserver.current // has already started observing the container
    ) {
      return
    }

    hasInitializedObserver.current = true

    new IntersectionObserver(([entry], observer) => {
      if (!entry.isIntersecting) {
        return
      }
      if (viewTimeout.current !== null) {
        return
      }
      // Only sets as viewed if it stays in the viewport for ON_VIEW_DELAY milliseconds
      viewTimeout.current = window.setTimeout(() => {
        viewTimeout.current = null
        if (!ref.current) {
          return
        }
        if (!entry.isIntersecting) {
          return
        }
        observer.unobserve(ref.current)

        setHasBeenViewed(true)
      }, ON_VIEW_DELAY)
    }).observe(ref.current)
  }, [bailOut, ref])

  return { hasBeenViewed }
}

const HydrateOnView: FC<Props> = ({ children, id, loading }) => {
  const containerRef = useRef<HTMLElement | null>(null)

  const isSSR = !window.navigator

  const dehydratedElement =
    window &&
    window.document &&
    window.document.querySelector(`[data-hydration-id="${id}"]`)

  const hasDehydratedContent =
    dehydratedElement && dehydratedElement.childElementCount > 0
  const hasSSRendered = !!dehydratedElement && hasDehydratedContent
  const shouldRenderImmediately = !isSSR && !hasSSRendered

  const { hasBeenViewed } = useViewDetection({
    ref: containerRef,
    bailOut: shouldRenderImmediately || loading,
  })

  return (
    <PreventHydration ref={containerRef} shouldHydrate={hasBeenViewed} id={id}>
      {children}
    </PreventHydration>
  )
}

export default HydrateOnView
