interface MapSetValue<T> {
  count: number
  time: number
  value: T
}
interface Options {
  max?: number
  maxSize?: number
  maxAge?: number
  disposeFn?: (key: string) => void
}

class LRU<T> {
  private map: Map<string, MapSetValue<T>>
  private maxSize = Infinity
  private maxAge = 0
  private disposeFn: ((key: string) => void) | undefined

  private drop = 0
  private count = 0
  constructor(options: Options) {
    this.map = new Map() as Map<string, MapSetValue<T>>
    const n = typeof options === 'number'
    this.maxSize =
      (n ? (options as number) : options.max || options.maxSize) || Infinity
    this.maxAge = n ? 0 : options.maxAge || 0
    this.disposeFn = options.disposeFn
    this.drop = 0
    this.count = 0
  }

  private isExpired(value: MapSetValue<T>) {
    const expiration = Date.now() - this.maxAge
    return value.time < expiration
  }

  private _dropCount() {
    ;[...this.map[Symbol.iterator]()]
      .sort(([_1, entry1], [_2, entry2]) => {
        const prop = entry1.time === entry2.time ? 'count' : 'time'
        return entry2[prop] - entry1[prop]
      })
      .slice(this.maxSize)
      .forEach(([key]) => {
        this.map.delete(key)
        this.disposeFn && this.disposeFn(key)
      })
    this.drop = 0
  }

  public get(key: string) {
    const entry = this.map.get(key)
    if (entry && this.isExpired(entry)) {
      this.map.delete(key)
      this.disposeFn && this.disposeFn(key)
      return undefined
    }
    if (entry) {
      entry.count = this.count++
      return entry.value
    }
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

  public set(key: string, value: T) {
    const { maxSize } = this
    if (!this.drop && this.map.size === maxSize) {
      this.drop = setTimeout(() => this._dropCount())
    }

    this.map.set(key, {
      count: this.count++,
      time: Date.now(),
      value,
    })
  }
}

export default LRU
