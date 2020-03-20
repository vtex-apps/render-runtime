import React, {
  useRef,
  useEffect,
  useState,
  ReactNode,
  useLayoutEffect,
  FunctionComponent,
} from 'react'
import { traverseExtension } from '../../utils/components'
import { fetchAssets, getImplementation } from '../../utils/assets'
import { useDehydratedContent } from '../../hooks/hydration'
import { canUseDOM } from 'exenv'
import { useRuntime } from '../../core/main'

interface Props {
  shouldHydrate?: boolean
  children: ReactNode
  treePath: string
}

/** TODO: sometimes, the assets seem to load successfuly, but the component
 * implementation is not ready yet. This function works as a guarantee, but
 * need to understand it fully how it works so this verification can be avoided
 */
async function verifyComponentImplementation(
  runtime: RenderRuntime,
  treePath: string,
  retries = 10
): Promise<boolean> {
  const component = runtime?.extensions?.[treePath]?.component

  const componentImplementation = component && getImplementation(component)

  if (componentImplementation) {
    return true
  }

  if (retries > 0) {
    const timeout = 1100 - retries * 100
    await new Promise(resolve => setTimeout(resolve, timeout))
    const result = await verifyComponentImplementation(
      runtime,
      treePath,
      retries - 1
    )

    return result
  }
  throw new Error(`Unable to fetch component ${component}`)
}

function loadAssets(runtime: RenderRuntime, treePath: string) {
  if (canUseDOM) {
    const extensionAssets = traverseExtension(
      runtime.extensions,
      runtime.components,
      treePath,
      true
    )

    return new Promise(resolve => {
      fetchAssets(runtime, extensionAssets).then(() => {
        verifyComponentImplementation(runtime, treePath).then(resolve)
      })
    })
  }
  return new Promise(() => {})
}

/** "Transplants" images elements from elements that will be removed to the
 * elements that will replace them. Used to prevent images from blinking/
 * flickering when the "hydration" happens. */
const useTransplantImages = (id: string, shouldTransplant?: boolean) => {
  const transplantedImages = useRef<null | HTMLImageElement[]>(null)
  const { dehydratedElement } = useDehydratedContent(id)
  const didTransplantImages = useRef(false)

  /** If it can and should transplant images from the "dehydrated" element
   * to the "hydrated" one, takes all the images that are inside the server-
   * side-rendered element and inserts them temporarily at the end of the body */
  if (
    shouldTransplant &&
    dehydratedElement &&
    !didTransplantImages.current &&
    transplantedImages.current === null
  ) {
    const images = Array.from(dehydratedElement.querySelectorAll('img'))
    transplantedImages.current = images
    for (const image of images) {
      window?.document?.body.appendChild(image)
    }
  }

  /** Then, for each of them, look for the corresponding image element
   * on the hydrated component (via its src), and replace it.
   * This function is gonna be called by a useLayoutEffect below.
   */
  function transplantImages(element: Element, images: HTMLImageElement[]) {
    images.forEach(image => {
      const src = image.getAttribute('src') || image.getAttribute('data-src')

      const anchor = element.querySelector(`
        [data-src="${src}"]:not([data-hydration-transplanted]),
        [src="${src}"]:not([data-hydration-transplanted])`)

      if (!anchor) {
        // If couldn't find the corresponding image for some reason, throw it away
        image.remove()
        return
      }
      anchor.before(image)
      image.setAttribute('data-hydration-transplanted', 'true')
      anchor.remove()
    })
  }

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

    transplantImages(element, transplantedImages.current)

    didTransplantImages.current = true
  }, [id, didTransplantImages, transplantedImages, shouldTransplant])
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

const PreventHydration: FunctionComponent<Props> = ({
  children,
  shouldHydrate,
  treePath,
}) => {
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

  const containerProps = {
    'data-hydration-id': treePath,
    style: {
      display: 'contents',
    },
  }

  if (!isLoaded && !hasRenderedOnServer) {
    return <div {...containerProps} />
  }

  if (shouldRenderImmediately) {
    return <div {...containerProps}>{children}</div>
  }

  return shouldHydrate && isLoaded ? (
    <div {...containerProps}>{children}</div>
  ) : (
    /** This is the heart of this component (and it's a hack):
     * In order to "prevent hydration", it renders the same div as the other
     * return paths, but setting its innerHTML as an empty string. This makes
     * React not touch the div's content, as it's "out of its domain" since
     * it's a custom HTML it knows nothing about. So the effect is that the
     * HTML that comes from the server is kept.
     * This behaviour will (probably?) come from React itself in the future,
     * so this hack is supposed to be temporary.
     */
    <div
      {...containerProps}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{
        __html: '',
      }}
    />
  )
}

PreventHydration.displayName = 'PreventHydration'

export default React.memo(PreventHydration)
