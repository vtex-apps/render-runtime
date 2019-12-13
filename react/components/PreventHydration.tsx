import React, {
  useRef,
  useEffect,
  useState,
  ReactNode,
  useContext,
  createContext,
  useLayoutEffect,
  ForwardRefExoticComponent,
} from 'react'

interface HydrationContext {
  dehydratedContent: Record<string, string>
}

const HydrationContext = createContext<HydrationContext>({
  dehydratedContent: {},
})

interface Props {
  shouldHydrate?: boolean
  children: ReactNode
  id: string
}

type Ref = ForwardRefExoticComponent<
  (Props & React.RefAttributes<HTMLElement>) | null
>

const getDehydratedElement = (id: string) => {
  const ssrRenderedElement =
    window &&
    window.document &&
    window.document.querySelector(`[data-hydration-id="${id}"]`)

  return ssrRenderedElement || null
}

const usePreserveDehydratedElements = (id: string) => {
  const [dehydratedContent, setDehydratedContent] = useState({})

  useEffect(() => {
    const dehydratedElement = getDehydratedElement(id)

    const dehydratedElements =
      dehydratedElement &&
      dehydratedElement.querySelectorAll('[data-hydration-id]')

    const dehydratedContent = Array.from(dehydratedElements || [])
      .map(item => {
        return {
          key: item.getAttribute('data-hydration-id'),
          value: item.innerHTML,
        }
      })
      .reduce((acc, cur) => {
        if (!cur.key) {
          return acc
        }

        acc[cur.key] = cur.value
        return acc
      }, {} as any)

    setDehydratedContent(dehydratedContent)
  }, [id])

  return { dehydratedContent }
}

/** Transplants images elements from elements that will be removed to the
 * elements that will replace them. Used to prevent images from blinking
 * when "hydration" happens. */
const useTransplantImages = (id: string, shouldTransplant: boolean) => {
  const transplantedImages = useRef<null | HTMLImageElement[]>(null)
  const didTransplantImages = useRef(false)
  const isSSR = !window.navigator

  useLayoutEffect(() => {
    if (
      !shouldTransplant ||
      didTransplantImages.current ||
      !transplantedImages.current
    ) {
      return
    }

    const element = document.querySelector(`[data-hydration-id="${id}"]`)

    if (!element) {
      return
    }

    transplantedImages.current.forEach(image => {
      const anchor = element.querySelector(
        `[src="${image.getAttribute('src')}"]`
      )
      if (!anchor) {
        image.remove()
        return
      }
      anchor.before(image)
      anchor.remove()
    })

    didTransplantImages.current = true
  }, [id, didTransplantImages, transplantedImages, shouldTransplant])

  if (isSSR || !shouldTransplant) {
    return
  }

  const dehydratedElement = getDehydratedElement(id)

  if (dehydratedElement && transplantedImages.current === null) {
    const images = Array.from(dehydratedElement.querySelectorAll('img'))
    transplantedImages.current = images
    for (const image of images) {
      window.document.body.appendChild(image)
    }
  }
}

const PreventHydration = React.forwardRef<HTMLElement, Props>(
  ({ children, shouldHydrate, id }, ref) => {
    const isSSR = !window.navigator
    const hydrationContext = useContext(HydrationContext)

    const dehydratedElement = getDehydratedElement(id)
    const hasSSRContent =
      dehydratedElement && dehydratedElement.childElementCount > 0
    const shouldRenderImmediately = isSSR || !hasSSRContent

    const { dehydratedContent } = usePreserveDehydratedElements(id)
    const shouldTransplantImages = !!(shouldHydrate && !shouldRenderImmediately)

    useTransplantImages(id, shouldTransplantImages)

    if (shouldRenderImmediately) {
      return (
        <div data-hydration-id={id} style={{ display: 'contents' }}>
          {children}
        </div>
      )
    }

    return (
      <>
        <HydrationContext.Provider
          value={{
            dehydratedContent: {
              ...dehydratedContent,
              ...hydrationContext.dehydratedContent,
            },
          }}
        >
          {shouldHydrate ? (
            <div
              ref={ref as Ref}
              data-hydration-id={id}
              style={{ display: 'contents' }}
            >
              {children}
            </div>
          ) : (
            <div
              ref={ref as Ref}
              data-hydration-id={id}
              suppressHydrationWarning
              style={{ display: 'contents' }}
              dangerouslySetInnerHTML={{
                __html: hydrationContext.dehydratedContent[id] || '',
              }}
            />
          )}
        </HydrationContext.Provider>
      </>
    )
  }
)

PreventHydration.displayName = 'PreventHydration'

export default React.memo(PreventHydration)
