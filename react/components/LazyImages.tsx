import React, { useContext, FC } from 'react'
import styles from './LazyImages.css'
import { Helmet } from 'react-helmet'

interface LazyImagesContext {
  lazyLoad: boolean
  /** "native" uses the attribute "loading=lazy", which is good but only works
   * on Chrome. lazysizes is a JS plugin already provided by render-runtime,
   * with broader support, but the behaviour might be a little worse at times */
  method: 'native' | 'lazysizes'
}

const LazyImagesContext = React.createContext<LazyImagesContext>({
  lazyLoad: false,
  method: 'lazysizes',
})

interface LazyImagesProps {
  lazyLoad?: boolean
  experimentalMethod?: LazyImagesContext['method']
}

const LazyImages: FC<LazyImagesProps> = ({
  children,
  lazyLoad = true,
  experimentalMethod = 'lazysizes',
}) => {
  return (
    <LazyImagesContext.Provider
      value={{ lazyLoad, method: experimentalMethod }}
    >
      {children}
    </LazyImagesContext.Provider>
  )
}

const useLazyImagesContext = () => {
  const value = useContext(LazyImagesContext)

  return value
}

interface MaybeLazyImageProps {
  createElement: typeof React.createElement
  imageProps: Record<string, any>
  lazyType: string
}

const MaybeLazyImage: FC<MaybeLazyImageProps> = ({
  createElement = React.createElement,
  imageProps,
  lazyType,
}) => {
  const { lazyLoad, method } = useLazyImagesContext()

  if (lazyLoad && lazyType !== 'eager') {
    let newImageProps = imageProps

    switch (method) {
      case 'native':
        newImageProps = {
          ...imageProps,
          loading: 'lazy',
        }
        break
      case 'lazysizes':
        /** adds `lazyload` class to enable lazysizes, and moves the image URI
         * from src to data-src. `styles.lazyload` is used to hide the "broken image"
         * symbol while the image hasn't been loaded */
        newImageProps = {
          ...imageProps,
          // explicity key because we need react to re-render the whole img element
          // in case the src changes (i.e: product-summary + sku)
          key: imageProps.src,
          className: `lazyload ${imageProps.className ?? ''} ${
            styles.lazyload
          }`,
          src: undefined,
          'data-src': imageProps.src,
          loading: 'lazy',
        }
        break
    }
    return createElement.apply(React, ['img', newImageProps])
  }

  const isPreloaded = String(imageProps['data-vtex-preload']) === 'true'

  // If it's preloaded, render the image along with a Helmet that adds preload
  if (isPreloaded) {
    return (
      <>
        <Helmet
          link={[
            {
              rel: 'preload',
              as: 'image',
              href: imageProps.src,
              crossOrigin: imageProps.crossOrigin,
            },
          ]}
        />
        {createElement.apply(React, ['img', imageProps])}
      </>
    )
  }

  // Otherwise, just render the image
  return createElement.apply(React, ['img', imageProps])
}

export { LazyImages, MaybeLazyImage, useLazyImagesContext }
