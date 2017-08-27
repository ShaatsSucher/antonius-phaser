
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
