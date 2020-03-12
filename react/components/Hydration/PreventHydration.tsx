import React, {
  useRef,
  useEffect,
  useState,
  ReactNode,
  useLayoutEffect,
  ForwardRefExoticComponent,
} from 'react'
import { traverseExtension } from '../../utils/components'
import { fetchAssets } from '../../utils/assets'
import { useDehydratedContent } from '../../hooks/hydration'
import { canUseDOM } from 'exenv'
import { useRuntime } from '../../core/main'

interface Props {
  shouldHydrate?: boolean
  children: ReactNode
  treePath: string
}

type Ref = ForwardRefExoticComponent<
  (Partial<Props> & React.RefAttributes<HTMLElement>) | null
>

function loadAssets(runtime: RenderRuntime, treePath: string) {
  if (window.document) {
    const extensionAssets = traverseExtension(
      runtime.extensions,
      runtime.components,
      treePath,
      true
    )

    return new Promise(resolve => {
      fetchAssets(runtime, extensionAssets).then(() => {
        resolve()
      })
    })
  }
  return new Promise(() => {})
}

/** Transplants images elements from elements that will be removed to the
 * elements that will replace them. Used to prevent images from blinking
 * when "hydration" happens. */
const useTransplantImages = (id: string, shouldTransplant?: boolean) => {
  const transplantedImages = useRef<null | HTMLImageElement[]>(null)
  const { dehydratedElement } = useDehydratedContent(id)
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
      const src = image.getAttribute('src')
      const anchor = element.querySelector(`[src="${src}"]`)
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

  // const dehydratedElement = getDehydratedElement(id)

  if (dehydratedElement && transplantedImages.current === null) {
    const images = Array.from(dehydratedElement.querySelectorAll('img'))
    transplantedImages.current = images
    for (const image of images) {
      window?.document?.body.appendChild(image)
    }
  }
}

const useAssetLoading = (extensionPointId?: string, shouldLoad?: boolean) => {
  const runtime = useRuntime()
  const isSSR = !canUseDOM
  const [isLoaded, setIsLoaded] = useState(isSSR)

  useEffect(() => {
    if (!isLoaded && extensionPointId && shouldLoad) {
      loadAssets((runtime as unknown) as RenderRuntime, extensionPointId).then(
        () => {
          setIsLoaded(true)
        }
      )
    }
  }, [isLoaded, extensionPointId, shouldLoad, runtime])

  return { isLoaded }
}

const PreventHydration = React.forwardRef<HTMLElement, Props>(
  ({ children, shouldHydrate, treePath }, ref) => {
    const initialShouldHydrate = useRef(shouldHydrate)

    const { hasRenderedOnServer } = useDehydratedContent(treePath)

    const shouldRenderImmediately =
      !hasRenderedOnServer ||
      (shouldHydrate && shouldHydrate === initialShouldHydrate.current)

    const { isLoaded } = useAssetLoading(
      treePath,
      shouldRenderImmediately || shouldHydrate
    )
    const shouldTransplantImages =
      shouldHydrate && !shouldRenderImmediately && isLoaded

    useTransplantImages(treePath, shouldTransplantImages)

    if (!isLoaded && !hasRenderedOnServer) {
      return (
        <div data-hydration-id={treePath} style={{ display: 'contents' }} />
      )
    }

    if (shouldRenderImmediately) {
      return (
        <div data-hydration-id={treePath} style={{ display: 'contents' }}>
          {children}
        </div>
      )
    }

    return shouldHydrate && isLoaded ? (
      <div
        ref={ref as Ref}
        data-hydration-id={treePath}
        style={{ display: 'contents' }}
      >
        {children}
      </div>
    ) : (
      <div
        ref={ref as Ref}
        data-hydration-id={treePath}
        suppressHydrationWarning
        style={{ display: 'contents' }}
        dangerouslySetInnerHTML={{
          __html: '',
        }}
      />
    )
  }
)

PreventHydration.displayName = 'PreventHydration'

export default React.memo(PreventHydration)
