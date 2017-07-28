
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
