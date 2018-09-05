import {format, parse} from 'url'

export const IOFetch = async (uri: string | Request, init?: RequestInit): Promise<Response> => {
  const {useGetInBatch = false, body} = init || {} as any
  const formattedInit = {...init}
  let formattedUri = uri

  if (useGetInBatch && typeof uri === 'string' && formattedInit) {
    const parsedUri = parse(uri, true)

    delete parsedUri.search
    parsedUri.query = {...parsedUri.query, batch: body}

    delete formattedInit.body
    formattedInit.method = 'GET'

    formattedUri = format(parsedUri)
  }

  return fetch(formattedUri, formattedInit)
}
