
declare namespace Phaser {
  interface Signal {
    asPromise(): Promise<void>
  }
}

Phaser.Signal.prototype.asPromise = function asPromise() {
  return new Promise<void>(resolve => {
    this.addOnce(resolve)
  })
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
