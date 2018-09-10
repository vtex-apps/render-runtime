import {format, parse} from 'url'

export const IOFetch = async (urlOrRequest: string | Request, init?: RequestInit): Promise<Response> => {
  const {useGetInBatch = false, body} = init || {} as any
  const formattedInit: RequestInit = {...init}
  let formattedUrl = (typeof urlOrRequest === 'string') ? urlOrRequest : urlOrRequest.url

  if (useGetInBatch && formattedInit) {
    const parsedUri = parse(formattedUrl, true)

    delete parsedUri.search
    parsedUri.query = {...parsedUri.query, batch: body}

    delete formattedInit.body
    formattedInit.method = 'GET'

    formattedUrl = format(parsedUri)
  }

  return fetch(formattedUrl, formattedInit)
}
