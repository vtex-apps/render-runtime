import { useEffect, useRef, MutableRefObject } from 'react'

interface IntersectionEvent {
  entry: IntersectionObserverEntry
  unobserve: () => void
}

interface HookOptions {
  ref: MutableRefObject<HTMLElement | null>
  onView?: (event: IntersectionEvent) => any
  threshold?: number
  once?: boolean
  bailOut?: boolean
  initializeOnInteraction?: boolean
}

/** Hook for detecting when an element is inside the viewport.
 * Differs from react-intersection-observer (https://www.npmjs.com/package/react-intersection-observer)
 * in that this hook doesn't use setState, using a callback approach instead, to improve
 * performance by preventing re-rendering.
 */
const useOnView = ({
  ref,
  onView,
  threshold = 0,
  once = false,
  bailOut = false,
  initializeOnInteraction = false,
}: HookOptions) => {
  const isObserving = useRef(false)
  const didIntersect = useRef(false)

  useEffect(() => {
    const initializeObserver = () => {
      const element = ref.current

      if (
        bailOut ||
        isObserving.current ||
        !element ||
        !onView ||
        (once && didIntersect.current)
      ) {
        return () => {}
      }

      isObserving.current = true

      const unobserve = () => {
        if (isObserving.current) {
          observer.unobserve(element)
          isObserving.current = false
        }
      }

      const observer = new IntersectionObserver(([entry]) => {
        if (!entry.isIntersecting) {
          return
        }

        if (entry.intersectionRatio < threshold) {
          return
        }

        if (once) {
          unobserve()
        }

        didIntersect.current = true
        onView({ entry, unobserve })
      })

      observer.observe(element)

      return unobserve
    }

    if (initializeOnInteraction) {
      const cleanUpEvents = () => {
        window?.document?.removeEventListener('scroll', handleInteraction)
        window?.document?.removeEventListener('mouseover', handleInteraction)
      }

      let unobserve = () => {
        cleanUpEvents()
      }

      const handleInteraction = () => {
        cleanUpEvents()
        unobserve = initializeObserver()
      }

      window?.document?.addEventListener('scroll', handleInteraction)
      window?.document?.addEventListener('mouseover', handleInteraction)

      /** Triggers interaction event if the user has scrolled the
       * page before JS being initialized */
      if (window?.scrollY > 0) {
        handleInteraction()
      }

      return unobserve
    }

    return initializeObserver()
  }, [bailOut, initializeOnInteraction, onView, once, ref, threshold])
}

export { useOnView }
