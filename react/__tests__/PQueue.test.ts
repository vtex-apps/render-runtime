import PQueue from '../components/Prefetch/PQueue'

const sleep = (time: number) =>
  new Promise((resolve) => setTimeout(resolve, time))

beforeEach(() => {
  jest.resetAllMocks()
})
it('should start all promises', async () => {
  const mockFn = jest.fn()
  const myPromiseFn = () =>
    new Promise(async (resolve) => {
      await sleep(100)
      mockFn()
      resolve()
    })

  const queue = new PQueue({})
  queue.add(myPromiseFn)
  queue.add(myPromiseFn)
  queue.add(myPromiseFn)

  await sleep(500)
  expect(mockFn).toBeCalledTimes(3)
})

it('should respect the maximum concurrency', async () => {
  const mockFn = jest.fn()
  const myPromiseFn = () =>
    new Promise(async (resolve) => {
      await sleep(500)
      mockFn()
      resolve()
    })

  const queue = new PQueue({ concurrency: 2 })
  queue.add(myPromiseFn)
  queue.add(myPromiseFn)
  queue.add(myPromiseFn)
  queue.add(myPromiseFn)
  queue.add(myPromiseFn)

  await sleep(700)
  expect(mockFn).toBeCalledTimes(2)

  await sleep(400)
  expect(mockFn).toBeCalledTimes(4)
})

it('should add with priority', async () => {
  const mockFn = jest.fn()
  const mockPriorityFn = jest.fn()
  const myPromiseFn = () =>
    new Promise(async (resolve) => {
      await sleep(500)
      mockFn()
      resolve()
    })

  const myPromisePriorityFn = () =>
    new Promise(async (resolve) => {
      await sleep(500)
      mockPriorityFn()
      resolve()
    })

  const queue = new PQueue({ concurrency: 2 })
  queue.add(myPromiseFn)
  queue.add(myPromiseFn)
  await sleep(100)
  queue.add(myPromisePriorityFn, { priority: 1 })
  queue.add(myPromiseFn)
  queue.add(myPromiseFn)

  await sleep(700)
  expect(mockFn).toBeCalledTimes(2)

  await sleep(400)
  expect(mockFn).toBeCalledTimes(3)
  expect(mockPriorityFn).toBeCalledTimes(1)
})

it('should respect autoStart false argument', async () => {
  const mockFn = jest.fn()
  const mockPriorityFn = jest.fn()
  const myPromiseFn = () =>
    new Promise(async (resolve) => {
      await sleep(100)
      mockFn()
      resolve()
    })

  const myPromisePriorityFn = () =>
    new Promise(async (resolve) => {
      await sleep(100)
      mockPriorityFn()
      resolve()
    })

  const queue = new PQueue({ autoStart: false })

  queue.add(myPromiseFn)
  queue.add(myPromiseFn)
  queue.add(myPromisePriorityFn, { priority: 1 })
  queue.add(myPromiseFn)
  queue.add(myPromiseFn)
  await sleep(200)
  expect(mockFn).toBeCalledTimes(0)
  expect(mockPriorityFn).toBeCalledTimes(0)

  queue.start()
  await sleep(800)
  expect(mockFn).toBeCalledTimes(4)
  expect(mockPriorityFn).toBeCalledTimes(1)
})

it('pause method should freeze queue', async () => {
  const mockFn = jest.fn()
  const myPromiseFn = () =>
    new Promise(async (resolve) => {
      await sleep(200)
      mockFn()
      resolve()
    })

  const queue = new PQueue({})

  queue.add(myPromiseFn)
  queue.add(myPromiseFn)

  queue.pause()

  queue.add(myPromiseFn)
  queue.add(myPromiseFn)

  await sleep(300)
  expect(mockFn).toBeCalledTimes(2)

  queue.start()
  await sleep(300)
  expect(mockFn).toBeCalledTimes(4)
})

it('clear method should empty the queue', async () => {
  const mockBeforeFn = jest.fn()
  const mockAfterFn = jest.fn()
  const myPromiseBeforeFn = () =>
    new Promise(async (resolve) => {
      await sleep(200)
      mockBeforeFn()
      resolve()
    })

  const myPromiseAfterFn = () =>
    new Promise(async (resolve) => {
      await sleep(200)
      mockAfterFn()
      resolve()
    })

  const queue = new PQueue({ autoStart: false })

  queue.add(myPromiseBeforeFn)
  queue.add(myPromiseBeforeFn)

  queue.clear()

  queue.add(myPromiseAfterFn)
  queue.add(myPromiseAfterFn)
  queue.start()

  await sleep(300)
  expect(mockBeforeFn).toBeCalledTimes(0)
  expect(mockAfterFn).toBeCalledTimes(2)
})
