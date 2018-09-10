import {format, parse} from 'url'
import URLSearchParams from 'url-search-params'

const separator = '@@'

const graphqlStringify = (obj: any) => [obj.operationName, JSON.stringify(obj.variables || {}), JSON.stringify(obj.extensions || {})].join(separator)

export const IOFetch = async (urlOrRequest: string | Request, init?: RequestInit): Promise<Response> => {
  const {useGetInBatch = false, body} = init || {} as any
  const formattedInit: RequestInit = {...init}
  let formattedUrl = typeof urlOrRequest === 'string' ? urlOrRequest : urlOrRequest.url

  if (useGetInBatch && formattedInit) {
    const parsedUri = parse(formattedUrl, true)
    const formattedBody = JSON.parse(body || '{}')
    const searchParams = new URLSearchParams(parsedUri.search)
    formattedBody.forEach((obj: any) => searchParams.append('batch', graphqlStringify(obj)))
    parsedUri.search = searchParams.toString()
    formattedInit.body = undefined
    formattedInit.method = 'GET'
    formattedUrl = format(parsedUri)
  }

  return fetch(formattedUrl, formattedInit)
}
