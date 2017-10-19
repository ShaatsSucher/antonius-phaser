
declare namespace Phaser {
  interface Signal {
    asPromise(): Promise<void>

    combine(other: Phaser.Signal): Phaser.Signal
    combineWith<L, R, T>(other: Phaser.Signal, fn: (L, R) => T): Phaser.Signal
    filter<T>(fn: (T) => boolean): Phaser.Signal
    map<F, T>(fn: (F) => T): Phaser.Signal
    flatMap<F, T>(fn: (F) => T): Phaser.Signal
    discardDuplicates(): Phaser.Signal
  }
}

Phaser.Signal.prototype.asPromise = function asPromise() {
  return new Promise<void>(resolve => {
    this.addOnce(resolve)
  })
}

Phaser.Signal.prototype.combine = function combine(other: Phaser.Signal): Phaser.Signal {
  let lastSelf = null
  let lastOther = null
  const signal = new Phaser.Signal()
  const dispatch = () => signal.dispatch([lastSelf, lastOther])
  this.add(value => { lastSelf = value; dispatch() })
  other.add(value => { lastOther = value; dispatch() })
  return signal
}

Phaser.Signal.prototype.combineWith = function combineWith<L, R, T>(other: Phaser.Signal, fn: (L, R) => T): Phaser.Signal {
  return this.combine(other).map(values => {
    const [l, r] = values
    return fn(l, r)
  })
}

Phaser.Signal.prototype.filter = function filter<T>(fn: (T) => boolean): Phaser.Signal {
  const signal = new Phaser.Signal()
  this.add(value => fn(value) && signal.dispatch(value))
  return signal
}

Phaser.Signal.prototype.map = function map<F, T>(fn: (F) => T): Phaser.Signal {
  const signal = new Phaser.Signal()
  this.add(value => signal.dispatch(fn(value)))
  return signal
}

Phaser.Signal.prototype.flatMap = function flatMap<F, T>(fn: (F) => T): Phaser.Signal {
  return this.filter(value => value !== null).map(fn)
}

Phaser.Signal.prototype.discardDuplicates = function discardDuplicates(): Phaser.Signal {
  const signal = new Phaser.Signal()
  let firstValue = true
  let previousValue: any = null
  this.add(value => {
    if (firstValue || previousValue !== value) {
      firstValue = false
      previousValue = value
      signal.dispatch(value)
    }
  })
  return signal
}

interface Array<T> {
  flatMap<U>(callback: (currentValue: T, index: number, array: T[]) => U): U[]
}
Array.prototype.flatMap = function flatMap<U>(callback: (currentValue, index: number, array: any[]) => U): U[] {
  return this.map(callback).filter(value =>
    value !== undefined && value !== null
  )
}

interface Storage {
  getNumber(key: string, defaultValue: number): number
}
Storage.prototype.getNumber = function getNumber(key: string, defaultValue: number): number {
  const storedValue = window.localStorage.getItem(key)
  if (storedValue === null) {
    return defaultValue
  }
  const parsedValue = parseFloat(storedValue)
  return isNaN(parsedValue) ? defaultValue : parsedValue
}

interface Promise<T> {
  all(callback: () => void): Promise<T>
}
Promise.prototype.all = function any(callback: () => void) {
  return this.then(callback, callback)
}
