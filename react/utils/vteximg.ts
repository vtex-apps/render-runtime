const SECURE_PROTOCOL = 'https://'
const PROTOCOL_RELATIVE_PREFIX = '//'
const ARQUIVOS_RELATIVE_PREFIX = '/arquivos'
const ASSETS_RELATIVE_PREFIX = '/assets'
const FILE_MANAGER_PATH_REGEX = /url\("?(.*\/)assets\/vtex\.file-manager-graphql/

const MAX_MOBILE_IMAGE_WIDTH = 480
export const DEFAULT_SIZES = `(max-width: ${MAX_MOBILE_IMAGE_WIDTH}px) ${MAX_MOBILE_IMAGE_WIDTH}px, 800px`

export function createSrcSetFromSrc(src: string) {
  const matched = src.match(/arquivos\/ids\/(.*)-(.*)-(.*)/)
  if (!matched) {
    return null
  }
  const [, id, width, height] = matched
  return `${src.replace(`${id}-${width}-${height}`, `${id}-${MAX_MOBILE_IMAGE_WIDTH}-${height}`)} ${MAX_MOBILE_IMAGE_WIDTH}w, ${src} ${width}w`
}

export function optimizeSrcForVtexImg(vtexImgHost: string, appsEtag: string, src?: any) {
  try {
    if (src && src.indexOf(PROTOCOL_RELATIVE_PREFIX) === 0) {
      return src.replace(PROTOCOL_RELATIVE_PREFIX, SECURE_PROTOCOL)
    }

    if (
      src &&
      (src.indexOf(ARQUIVOS_RELATIVE_PREFIX) === 0 ||
        src.indexOf(ASSETS_RELATIVE_PREFIX) === 0)
    ) {
      const [srcPath, maybeQuery] = src.split('?')

      // Add v query string so portal api returns a longer cache max-age.
      const query = src.indexOf(ARQUIVOS_RELATIVE_PREFIX) === 0
        ? (maybeQuery ? `?${maybeQuery}&v=${appsEtag}` : `?v=${appsEtag}`)
        : (maybeQuery ? `?${maybeQuery}` : '')

      return vtexImgHost + srcPath + query
    }

    return src
  } catch (e) {
    console.warn('Failed to optimize image source.')
    return src
  }
}

export function optimizeStyleForVtexImg(vtexImgHost: string, style?: any) {
  try {
    if (style && style.backgroundImage) {
      const match = FILE_MANAGER_PATH_REGEX.exec(style.backgroundImage)
      if (match && match[1]) {
        style.backgroundImage = style.backgroundImage.replace(
          match[1],
          vtexImgHost + '/'
        )
      }
    }

    return style
  } catch (e) {
    console.warn('Failed to optimize style.')
    return style
  }
}

export function isStyleWritable(props: any): boolean {
  const propertyDescriptor = Object.getOwnPropertyDescriptor(props, 'style')
  return (propertyDescriptor && propertyDescriptor.writable) || false
}
