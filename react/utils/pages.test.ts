import {
  formatPathParameters,
  getComparablePrecedence,
  mapToQueryString,
  queryStringToMap,
} from './pages'
import RouteParser from 'route-parser'

describe('#mapToQueryString', () => {
  it('should escape a literal +, & and # inside values', () => {
    expect(mapToQueryString({ map: 'ft,cor', query: '/h+/verde' })).toBe(
      'map=ft,cor&query=/h%2B/verde'
    )
    expect(mapToQueryString({ map: 'ft,cor', query: '/h&m/verde' })).toBe(
      'map=ft,cor&query=/h%26m/verde'
    )
    expect(mapToQueryString({ map: 'ft,cor', query: '/c#/verde' })).toBe(
      'map=ft,cor&query=/c%23/verde'
    )
  })

  it('should keep the value after being parsed and written again', () => {
    const terms = ['h+', 'h&m', 'c#', 'blue shirt']

    const results = terms.map((term) => {
      const written = mapToQueryString(
        queryStringToMap(`?_q=${encodeURIComponent(term)}`)
      )

      return queryStringToMap(mapToQueryString(queryStringToMap(written)))._q
    })

    expect(results).toEqual(terms)
  })

  it('should not encode anything else', () => {
    expect(mapToQueryString({ map: 'ft,cor', query: '/blue shirt/50%' })).toBe(
      'map=ft,cor&query=/blue shirt/50%'
    )
  })

  it('should keep arrays, numbers, null and undefined as before', () => {
    expect(
      mapToQueryString({
        tag: ['a+b', 'c'],
        page: 2,
        searchState: null,
        order: undefined,
      })
    ).toBe('page=2&searchState&tag=a%2Bb&tag=c')
  })
})

describe('#formatPathParameters', () => {
  it('should remove any encoding', () => {
    const params = [
      {
        term: 'a%2520b%2520c',
      },
      {
        term: 'a%20b%20c',
      },
    ]

    const results = params.map((param) => formatPathParameters(param))

    expect(results).toEqual([{ term: 'a%20b%20c' }, { term: 'a b c' }])
  })
})

describe('#routeParser', () => {
  it('should not add double enconding', () => {
    const params = [
      {
        term: 'a',
      },
      {
        term: 'b',
      },
      {
        term: 'a%20b%20c',
      },
    ]

    const validTemplate = ['/:term', '/:term', '/:term']

    const results = params.map((param, index) =>
      new RouteParser(validTemplate[index]).reverse(param)
    )

    expect(results).toEqual(['/a', '/b', '/a%20b%20c'])
  })
})

describe('#getPrecedence', () => {
  it('should set precedence as expected', () => {
    const routes = [
      '/a/b/c',
      '/a/:b/c',
      '/:a/b/c',
      '/a/b/:c',
      '/a/:b/:c',
      '/:a/b/:c',
      '/a/b/*c',
      '/a/:b/*c',
      '/:a/b/*c',
      '/a/*b',
      '/:a/*b',
      '/*a',
    ]

    const result = routes.sort((a, b) =>
      getComparablePrecedence(b) > getComparablePrecedence(a) ? -1 : 1
    )

    expect(result).toEqual([
      '/a/b/c',
      '/a/b/:c',
      '/a/b/*c',
      '/a/:b/c',
      '/a/:b/:c',
      '/a/:b/*c',
      '/a/*b',
      '/:a/b/c',
      '/:a/b/:c',
      '/:a/b/*c',
      '/:a/*b',
      '/*a',
    ])
  })
})
