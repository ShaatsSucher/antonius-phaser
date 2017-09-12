export class Property<T> {
  public onValueChanged = new Phaser.Signal()

  constructor(private _value: T) { }

  public get value(): T {
    return this._value
  }

  public set value(newValue: T) {
    if (this._value === newValue) {
      return
    }
    this._value = newValue
    this.onValueChanged.dispatch(newValue)
  }
}
