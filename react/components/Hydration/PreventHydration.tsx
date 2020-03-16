import React, {
  useRef,
  useEffect,
  useState,
  ReactNode,
  useLayoutEffect,
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

/** Transplants images elements from elements that will be removed to the
 * elements that will replace them. Used to prevent images from blinking
 * when "hydration" happens. */
const useTransplantImages = (id: string, shouldTransplant?: boolean) => {
  const transplantedImages = useRef<null | HTMLImageElement[]>(null)
  const { dehydratedElement } = useDehydratedContent(id)
  const didTransplantImages = useRef(false)
  const isSSR = !canUseDOM

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

const PreventHydration = React.forwardRef<HTMLDivElement, Props>(
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

    const containerProps = {
      ref,
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
      <div
        {...containerProps}
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: '',
        }}
      />
    )
  }
)

PreventHydration.displayName = 'PreventHydration'

export default React.memo(PreventHydration)
