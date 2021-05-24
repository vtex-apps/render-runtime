import queryString from 'query-string'
import { pickBy } from 'ramda'

export const appendLocationSearch = (
  search: string,
  params: Record<string, string>
) => {
  if (!search) {
    return `?${queryString.stringify(params, { encode: true })}`
  }

  const included = queryString.parse(search)
  const filteredParams = pickBy(
    (_, paramName) => !(paramName in included),
    params
  ) as Record<string, string>
  const additionalSearch = queryString.stringify(filteredParams, {
    encode: true,
  })
  if (!additionalSearch) {
    return search
  }

  return `${search}&${additionalSearch}`
}
