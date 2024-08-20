import { extractExtra } from './extractExtra'

describe('extractExtra', () => {
  test('should return an empty object when err is an empty object', () => {
    const err = {}
    const result = extractExtra(err)
    expect(result).toEqual({})
  })

  test('should extract simple key-value pairs', () => {
    const err = { key1: 'value1', key2: 'value2' }
    const result = extractExtra(err)
    expect(result).toEqual({
      admin_extra_level_0_key1: 'value1',
      admin_extra_level_0_key2: 'value2',
    })
  })

  test('should extract nested objects', () => {
    const err = {
      key1: 'value1',
      nested: {
        key2: 'value2',
        deeper: {
          key3: 'value3',
        },
      },
    }
    const result = extractExtra(err)
    expect(result).toEqual({
      admin_extra_level_0_key1: 'value1',
      admin_extra_level_1_key2: 'value2',
      admin_extra_level_2_key3: 'value3',
    })
  })

  test('should ignore functions', () => {
    const err = {
      key1: 'value1',
      func: () => {},
    }
    const result = extractExtra(err)
    expect(result).toEqual({
      admin_extra_level_0_key1: 'value1',
    })
  })

  test('real world example #1', () => {
    const err = {
      details: {
        graphQLErrors: '[Array]',
        message: 'messages',
        name: 'Error',
        stack: 'Some error stack',
      },
      stack: 'Some error stack',
    }

    const result = extractExtra(err)
    expect(result).toEqual({
      admin_extra_level_1_graphQLErrors: '[Array]',
      admin_extra_level_1_message: 'messages',
      admin_extra_level_1_name: 'Error',
      admin_extra_level_1_stack: 'Some error stack',
      admin_extra_level_0_stack: 'Some error stack',
    })
  })

  test('should return the original input when it is not an object (string)', () => {
    const err = 'error'
    const result = extractExtra(err)
    expect(result).toEqual(err)
  })

  test('should return the original input when it is not an object (boolean)', () => {
    const err = false
    const result = extractExtra(err)
    expect(result).toEqual(err)
  })

  test('should return the original input when it is not an object (undefined)', () => {
    const result = extractExtra(undefined)
    expect(result).toEqual(undefined)
  })

  test('circular references given as input returns an empty object', () => {
    class Validator {
      model: any

      constructor(model: any) {
        this.model = model
      }
    }

    class Model {
      _attributes: any
      validator: any

      constructor() {
        this._attributes = {}
        this.validator = new Validator(this)
      }
    }

    const model = new Model()

    const result = extractExtra(model)
    expect(result).toEqual({})
  })
})
