class Node<T> {
  public next: Node<T> | null
  public prev: Node<T> | null
  public key: string
  public value: T
  public time: number
  constructor(
    key: string,
    value: T,
    next: Node<T> | null = null,
    prev: Node<T> | null = null,
    time?: number
  ) {
    this.next = next
    this.value = value
    this.prev = prev
    this.key = key
    this.time = time ?? Date.now()
  }
}

interface Options {
  max?: number
  maxSize?: number
  maxAge?: number
  disposeFn?: (key: string) => void
}

class LRU<T> {
  private map: Map<string, Node<T>>
  private maxSize = Infinity
  private maxAge = 0
  private disposeFn: ((key: string) => void) | undefined

  private head: Node<T> | null = null
  private tail: Node<T> | null = null

  constructor(options: Options) {
    this.map = new Map() as Map<string, Node<T>>
    const n = typeof options === 'number'
    this.maxSize =
      (n ? (options as number) : options.max || options.maxSize) || Infinity
    this.maxAge = n ? 0 : options.maxAge || 0
    this.disposeFn = options.disposeFn
  }

  private isExpired(value: Node<T>) {
    if (this.maxAge <= 0) {
      return false
    }
    const expiration = Date.now() - this.maxAge
    return value.time < expiration
  }

  private ensureLimit() {
    if (this.map.size === this.maxSize && this.tail) {
      this.disposeFn && this.disposeFn(this.tail.key)
      this.remove(this.tail.key)
    }
  }

  private remove(key: string) {
    const node = this.map.get(key)
    if (!node) {
      return
    }
    if (node.prev !== null) {
      node.prev.next = node.next
    } else {
      this.head = node.next
    }

    if (node.next !== null) {
      node.next.prev = node.prev
    } else {
      this.tail = node.prev
    }

    this.map.delete(key)
  }

  public get(key: string) {
    const entry = this.map.get(key)
    if (entry && this.isExpired(entry)) {
      this.map.delete(key)
      this.disposeFn && this.disposeFn(key)
      return undefined
    }
    if (entry) {
      // node removed from it's position and cache
      this.remove(key)
      // write node again to the head of LinkedList to make it most recently used
      this.set(key, entry.value, entry.time)

      return entry.value
    }
    // console.log('teste ')
    return undefined
  }

  public has(key: string) {
    const entry = this.map.get(key)
    if (entry && this.isExpired(entry)) {
      this.map.delete(key)
      this.disposeFn && this.disposeFn(key)
      return false
    }
    return !!entry
  }

  public set(key: string, value: T, nodeTime?: number) {
    this.ensureLimit()

    if (!this.head) {
      //set new node to head and tail
      this.head = this.tail = new Node(key, value)
    } else {
      const node = new Node(key, value, this.head, null, nodeTime)
      //set new node to head
      this.head.prev = node
      this.head = node
    }

    this.map.set(key, this.head)
  }
}

export default LRU
