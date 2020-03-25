import React, { useContext, FC } from 'react'
import styles from './LazyImages.css'

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

export const useLazyImages = () => {
  const value = useContext(LazyImagesContext)

  return value
}

interface MaybeLazyImageProps {
  createElement: typeof React.createElement
  imageProps: Record<string, any>
}

const MaybeLazyImage: FC<MaybeLazyImageProps> = ({
  createElement = React.createElement,
  imageProps,
}) => {
  const { lazyLoad, method } = useLazyImages()

  if (lazyLoad) {
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

  // Otherwise, just render the image
  return createElement.apply(React, ['img', imageProps])
}

export { LazyImages, MaybeLazyImage }
