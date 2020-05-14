const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

const RETRY_STATUSES = [
  0,
  408,
  425,
  429,
  500,
  501,
  502,
  503,
  504,
  505,
  506,
  507,
  508,
  510,
  511,
]

const canRetry = (status: number) => RETRY_STATUSES.includes(status)

const ok = (status: number) => 200 <= status && status < 300
const isNotFound = (status: number) => status === 404

export const fetchWithRetry = (
  url: string,
  init: RequestInit,
  fetcher: GlobalFetch['fetch'],
  maxRetries = 3
) => {
  let status = 500
  const callFetch = (
    attempt = 0
  ): Promise<{ response: Response; error: any }> =>
    fetcher(url, init)
      .then(response => {
        status = response.status
        return ok(status) || isNotFound(status)
          ? { response, error: null }
          : response
              .json()
              .then(error => ({ response, error }))
              .catch(() => ({
                response,
                error: { message: 'Unable to parse JSON' },
              }))
      })
      .then(({ response, error }) => {
        if (error) {
          throw new Error(error.message || 'Unknown error')
        }
        return { response, error: null }
      })
      .catch(error => {
        console.error(error)

        if (attempt >= maxRetries || !canRetry(status)) {
          throw error
        }

        const ms = 2 ** attempt * 500
        return delay(ms).then(() => callFetch(++attempt))
      })

  return callFetch()
}
