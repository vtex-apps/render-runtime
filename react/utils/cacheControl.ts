const MINIMUM_MAX_AGE_S = 5
const DEFAULT_MAX_AGE_S = 10 * 60
const STATIC_PAGE_MAX_AGE_S = 7 * 24 * 60 * 60

const parseCacheControl = (cacheControl: string) => {
  const cacheDirectives = cacheControl.split(',').map(d => d.trim())
  const maxAgeDirective = cacheDirectives.find(d => d.startsWith('max-age'))
  const [, maxAgeStr] = maxAgeDirective ? maxAgeDirective.split('=') : [, null]
  const maxAge = maxAgeStr ? parseInt(maxAgeStr, 10) : 0

  return {
    maxAge,
    noCache: cacheDirectives.includes('no-cache'),
    noStore: cacheDirectives.includes('no-store'),
  }
}

const getMaxAge = (response: Response) => {
  const cacheControlHeader = response.headers.get('cache-control')
  if (!cacheControlHeader) {
    return DEFAULT_MAX_AGE_S
  }

  const {noCache, noStore, maxAge} = parseCacheControl(cacheControlHeader)
  if (noCache || noStore) {
    return MINIMUM_MAX_AGE_S
  }

  return Math.max(MINIMUM_MAX_AGE_S, maxAge)
}

export default class PageCacheControl {
  private maxAges: number[] = []

  get maxAge(): number {
    return this.maxAges.length > 0
      ? Math.min(...this.maxAges)
      : STATIC_PAGE_MAX_AGE_S
  }

  public evaluate (innerResponse: Response) {
    const responseMaxAge = getMaxAge(innerResponse)
    this.maxAges.push(responseMaxAge)
  }
}
