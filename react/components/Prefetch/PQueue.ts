type PromiseFn = () => Promise<any>

interface QueueObject {
  promise: PromiseFn
  priority: number | undefined
}

interface AddOptions {
  priority?: number
}

interface Options {
  concurrency?: number
  autoStart?: boolean
}

function compareNumbers(a: QueueObject, b: QueueObject) {
  return (b.priority ?? 0) - (a.priority ?? 0)
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
    this.queue.push({ promise, priority: options.priority })
    this.queue.sort(compareNumbers)
  }
}

export default PQueue
