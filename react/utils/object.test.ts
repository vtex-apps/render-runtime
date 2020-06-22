import { flatObj, transformLeaves } from './object'

test('flattens a deep object', () => {
  const obj = {
    a: { b: { c: { d: 'foo' } } },
    e: { f: 'bar' },
  }
  expect(flatObj(obj)).toMatchObject({
    'a.b.c.d': 'foo',
    'e.f': 'bar',
  })
})

test('flattens a deep object with array values', () => {
  const obj = {
    a: { b: { c: { d: ['foo', 'bar'] } } },
    e: { f: ['foo', 'bar'] },
  }
  expect(flatObj(obj)).toMatchInlineSnapshot(
    {
      'a.b.c.d': ['foo', 'bar'],
      'e.f': ['foo', 'bar'],
    },
    `
        Object {
          "a.b.c.d": Array [
            "foo",
            "bar",
          ],
          "e.f": Array [
            "foo",
            "bar",
          ],
        }
    `
  )
})

test('transforms shallow leaves', () => {
  const obj = {
    a: 'foo',
    b: 'foo',
    c: 'bar',
  }

  const newObj = transformLeaves(obj, ({ value }) => {
    if (value !== 'foo') return
    return 'baz'
  })

  expect(newObj).toMatchInlineSnapshot(
    {
      a: 'baz',
      b: 'baz',
      c: 'bar',
    },
    `
        Object {
          "a": "baz",
          "b": "baz",
          "c": "bar",
        }
    `
  )
})

test('transforms deep leaves', () => {
  const obj = {
    a: { b: { c: { d: 'foo' } } },
    e: { f: 'bar' },
  }

  const newObj = transformLeaves(obj, ({ value }) => {
    if (value !== 'bar') return
    return 'baz'
  })

  expect(newObj).toMatchInlineSnapshot(
    {
      a: { b: { c: { d: 'foo' } } },
      e: { f: 'baz' },
    },
    `
        Object {
          "a": Object {
            "b": Object {
              "c": Object {
                "d": "foo",
              },
            },
          },
          "e": Object {
            "f": "baz",
          },
        }
    `
  )
})

test('transforms leaves inside arrays', () => {
  const obj = {
    a: [{ b: 'foo' }, { c: 'foo' }, { d: [{ e: 'bar' }] }],
    x: ['y', 'z'],
  }

  const newObj = transformLeaves(obj, ({ value }) => {
    if (value === 'foo') return 'baz'
    if (value === 'bar') return 'aux'
    return
  })

  expect(newObj).toMatchInlineSnapshot(
    {
      a: [{ b: 'baz' }, { c: 'baz' }, { d: [{ e: 'aux' }] }],
      x: ['y', 'z'],
    },
    `
    Object {
      "a": Array [
        Object {
          "b": "baz",
        },
        Object {
          "c": "baz",
        },
        Object {
          "d": Array [
            Object {
              "e": "aux",
            },
          ],
        },
      ],
      "x": Array [
        "y",
        "z",
      ],
    }
  `
  )
})
