import { escapeRegex, isDirectChild } from './treePath'

describe('#escapeRegex', () => {
  const specialRegexCharacters = [
    '[',
    ']',
    '\\',
    '^',
    '$',
    '.',
    '|',
    '?',
    '*',
    '+',
    '(',
    ')',
  ]

  it(`should prefix regex special characters: [ '${specialRegexCharacters.join(
    `', '`
  )}' ] with \\`, () => {
    specialRegexCharacters.forEach((specialRegexCharacter) => {
      expect(escapeRegex(specialRegexCharacter)).toEqual(
        `\\${specialRegexCharacter}`
      )
    })
  })

  it('should return own string if there are no special characters', () => {
    expect('testString').toBe('testString')
  })
})

describe('#isDirectChild', () => {
  it('should return true for one level of nesting', () => {
    expect(isDirectChild('store/home/shelf', 'store/home')).toBe(true)
  })

  it('should allow "_" on names', () => {
    expect(isDirectChild('store/home/shelf_0', 'store/home')).toBe(true)
  })

  it('should allow regex special characters on names', () => {
    expect(
      isDirectChild('store/home/$before_0/shelf_0', 'store/home/$before_0')
    ).toBe(true)
  })

  it('should return false for 2 levels nesting', () => {
    expect(isDirectChild('store/home/shelf/image', 'store/home')).toBe(false)
  })
})
