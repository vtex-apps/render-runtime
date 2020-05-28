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
  expect(flatObj(obj)).toMatchObject({
    'a.b.c.d.0': 'foo',
    'a.b.c.d.1': 'bar',
    'e.f.0': 'foo',
    'e.f.1': 'bar',
  })
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

  expect(newObj).toMatchObject({
    a: 'baz',
    b: 'baz',
    c: 'bar',
  })
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

  expect(newObj).toMatchObject({
    a: { b: { c: { d: 'foo' } } },
    e: { f: 'baz' },
  })
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

  expect(newObj).toMatchObject({
    a: [{ b: 'baz' }, { c: 'baz' }, { d: [{ e: 'aux' }] }],
    x: ['y', 'z'],
  })
})
