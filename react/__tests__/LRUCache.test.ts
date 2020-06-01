import LRU from '../components/Prefetch/LRUCache'

const sleep = (time: number) =>
  new Promise((resolve) => setTimeout(resolve, time))

test('get and set works', () => {
  const lru = new LRU({ max: 1 })
  const a = 1
  lru.set('a', a)
  expect(lru.get('a')).toBe(a)
})

test('max options works', () => {
  const lru = new LRU({ max: 2 })
  const a = 1
  const b = 2
  lru.set('a', a)
  lru.set('b', b)
  expect(lru.get('a')).toBe(a)
  const c = 3
  lru.set('c', c)
  expect(lru.get('a')).toBe(a)
  expect(lru.get('c')).toBe(c)
  expect(lru.get('b')).toBe(undefined)
})

test('maxSize options works', () => {
  const lru = new LRU({ maxSize: 2 })
  const a = 1
  const b = 2
  lru.set('a', a)
  lru.set('b', b)
  expect(lru.get('a')).toBe(a)
  const c = 3
  lru.set('c', c)
  expect(lru.get('a')).toBe(a)
  expect(lru.get('c')).toBe(c)
  expect(lru.get('b')).toBe(undefined)
})

test('will remove the key in tail', () => {
  const lru = new LRU({ max: 3 })
  const a = 1
  const b = 2
  const c = 3
  const d = 4
  lru.set('a', a)
  lru.set('b', b)
  lru.set('c', c)
  lru.get('a')
  lru.get('b')
  lru.get('a')
  lru.get('c')
  lru.get('a')
  // cache is now a - c - b, b in tail

  lru.set('d', d)

  expect(lru.get('a')).toBe(a)
  expect(lru.get('c')).toBe(c)
  expect(lru.get('d')).toBe(d)
  expect(lru.get('b')).toBe(undefined)
})

test('dispose function is called when key is removed', () => {
  const dispose = jest.fn()
  const lru = new LRU({ max: 2, disposeFn: dispose })
  const a = 1
  const b = 2
  lru.set('a', a)
  lru.set('b', b)
  expect(lru.get('a')).toBe(a)
  const c = 3
  lru.set('c', c)

  expect(dispose).toBeCalledTimes(1)
  expect(dispose).toBeCalledWith('b')
  dispose.mockClear()
  lru.get('c')
  lru.get('c')
  lru.set('d', 4)
  expect(dispose).toBeCalledTimes(1)
  expect(dispose).toBeCalledWith('a')
})

test('max age parameter works', async () => {
  const dispose = jest.fn()
  const lru = new LRU({ max: 3, maxAge: 500, disposeFn: dispose })
  const a = 1
  const b = 2
  const c = 3
  lru.set('a', a)
  lru.set('b', b)

  await sleep(200)
  expect(lru.get('a')).toBe(a)
  expect(lru.get('b')).toBe(b)
  lru.set('c', c)

  await sleep(400)
  expect(lru.get('a')).toBe(undefined)
  expect(lru.get('b')).toBe(undefined)
  expect(lru.get('c')).toBe(c)

  expect(dispose).toBeCalledTimes(2)
  expect(dispose).toHaveBeenNthCalledWith(1, 'a')
  expect(dispose).toHaveBeenNthCalledWith(2, 'b')
})
