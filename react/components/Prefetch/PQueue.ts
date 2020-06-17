type PromiseFn = () => Promise<any>

interface QueueObject {
  promise: PromiseFn
  priority: number
}

interface AddOptions {
  priority?: number
}

interface Options {
  concurrency?: number
  autoStart?: boolean
}

// Shifts the whole array in place one position to the right until a given index
function moveToRight<T>(array: T[], fromIndex: number) {
  for (let i = array.length - 1; i >= fromIndex; i--) {
    array[i + 1] = array[i]
  }
}

// Find first element where the given priority is bigger than it
// This could be a Binary Search if performance become an issue.
const findFirstSmallerElement = (array: QueueObject[], priority: number) => {
  return array.findIndex((obj) => priority > obj.priority)
}

class PQueue {
  queue: QueueObject[] = []
  concurrency = 0
  runningPromisesCount = 0
  isActive = true

  constructor(options?: Options) {
    this.concurrency = options?.concurrency ?? 0
    if (options?.autoStart === false) {
      this.isActive = false
    }
  }

  public pause() {
    this.isActive = false
  }
  public clear() {
    this.queue = []
    this.runningPromisesCount = 0
  }
  public add(promise: PromiseFn, options?: AddOptions) {
    if (!this.canStart()) {
      this.enqueue(promise, options)
      return
    }

    this.startPromise(promise)
  }
  public start() {
    this.isActive = true
    const diff =
      this.concurrency > 0
        ? this.concurrency - this.runningPromisesCount
        : this.queue.length
    if (diff <= 0 || this.queue.length === 0) {
      return
    }

    for (let i = 0; i < diff; i++) {
      this.dequeue()
    }
  }

  private isFull() {
    return this.concurrency > 0 && this.runningPromisesCount >= this.concurrency
  }

  private canStart() {
    return this.isActive && !this.isFull()
  }

  private startPromise(promise: PromiseFn) {
    this.runningPromisesCount += 1
    promise()
      .then(() => {
        this.runningPromisesCount -= 1
        this.dequeue()
      })
      .catch(() => {
        this.runningPromisesCount -= 1
        this.dequeue()
      })
  }

  private dequeue() {
    if (this.queue.length > 0 && this.canStart()) {
      const { promise } = this.queue.shift() as QueueObject
      this.startPromise(promise)
    }
  }

  private enqueue(promise: PromiseFn, options: AddOptions = {}) {
    const newItem = { promise, priority: options.priority ?? 0 }
    if (this.queue.length > 1) {
      const lastElem = this.queue[this.queue.length - 1]
      if (newItem.priority > lastElem.priority) {
        const correctPosition = findFirstSmallerElement(
          this.queue,
          newItem.priority
        )
        moveToRight(this.queue, correctPosition)
        this.queue[correctPosition] = newItem
        return
      }
    }

    this.queue.push(newItem)
  }
}

export default PQueue
