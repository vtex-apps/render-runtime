import { formatPathParameters, getComparablePrecedence } from './pages'
import RouteParser from 'route-parser'

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
