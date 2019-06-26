import { getComparablePrecedence } from './pages'

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

    const result = routes.sort((a, b) => getComparablePrecedence(b) > getComparablePrecedence(a) ? -1 : 1)

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
