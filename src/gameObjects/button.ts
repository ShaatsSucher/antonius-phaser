import GameObject from './gameObject'
import { Spritesheets } from '../assets'

export enum ButtonState {
  DEFAULT,
  HOVERED,
  DOWN,
  DISABLED
}

type Frames = null | number[] | string[]

export class Button extends GameObject {
  /**
   * The internal state of the button. ButtonState.DISABLED will never be
   * assigned to this value but is only returned through the state getter.
   */
  private _state = ButtonState.DEFAULT
  private hovering = false
  public get state() {
    if (!this.interactionEnabled) return ButtonState.DISABLED
    return this._state
  }

  constructor(game: Phaser.Game, x: number, y: number, key: string,
              defaultFrames: Frames = [0], hoverFrames: Frames = [1],
              downFrames: Frames = [1], disabledFrames: Frames = [0],
              private useAnimations = true) {
    super(game, x, y, key)

    if (useAnimations) {
      this.animations.add('default', defaultFrames, 8, false)
      this.animations.add('hovered', hoverFrames, 8, false)
      this.animations.add('down', downFrames, 8, false)
      this.animations.add('disabled', disabledFrames, 8, false)
    }

    this.anchor = new Phaser.Point(0.5, 0.5)

    this.events.onInputOver.add(this.onInputOver, this)
    this.events.onInputOut.add(this.onInputOut, this)
    this.events.onInputDown.add(this.onInputDown, this)
    this.events.onInputUp.add(this.onInputUp, this)
  }

  public setInteractionEnabled(value: boolean) {
    super.setInteractionEnabled(value)
    this.alpha = value ? 1 : 0.6
    this.updateTexture()
  }

  private onInputOver() {
    this.hovering = true
    if (this.state === ButtonState.DOWN) return
    this._state = ButtonState.HOVERED
    this.updateTexture()
  }

  private onInputOut() {
    this.hovering = false
    if (this.state === ButtonState.DOWN) return
    this._state = ButtonState.DEFAULT
    this.updateTexture()
  }

  private onInputDown() {
    if (this.state === ButtonState.DOWN) return
    this._state = ButtonState.DOWN
    this.updateTexture()
  }

  private onInputUp() {
    if (this.state !== ButtonState.DOWN) return
    const bounds = new Phaser.Rectangle(this.x, this.y, this.width, this.height)
    this._state = this.hovering
      ? ButtonState.HOVERED
      : ButtonState.DEFAULT
    this.updateTexture()
  }

  protected updateTexture() {
    if (!this.useAnimations) return
    this.play(ButtonState[this.state].toLowerCase())
  }
}
