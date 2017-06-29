import GameObject from './gameObject'
import { Spritesheets } from '../assets'

export default class Arrow extends GameObject {
  private _enabled = false
  private hovered = false

  constructor(game: Phaser.Game, x: number, y: number) {
    super(game, x, y, Spritesheets.arrow.key)

    this.animations.add('default', [0], 1, false)
    this.animations.add('hovered', [1], 1, false)

    this.anchor = new Phaser.Point(0.5, 0.5)

    this.events.onInputOver.add(this.onInputOver, this)
    this.events.onInputOut.add(this.onInputOut, this)
  }

  public get enabled(): boolean {
    return this._enabled
  }

  public setInteractionEnabled(value: boolean) {
    super.setInteractionEnabled(value)
    this.alpha = value ? 1 : 0.6
    this.updateTexture()
  }

  private onInputOver() {
    if (this.hovered) return
    this.hovered = true
    this.updateTexture()
  }

  private onInputOut() {
    if (!this.hovered) return
    this.hovered = false
    this.updateTexture()
  }

  private updateTexture() {
    this.play(this.interactionEnabled && this.hovered ? 'hovered' : 'default')
  }
}
