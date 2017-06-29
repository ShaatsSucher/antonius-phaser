import { Spritesheets } from '../assets'

export default class Arrow extends Phaser.Sprite {
  private _enabled = false
  private hovered = false

  constructor(game: Phaser.Game, x: number, y: number) {
    super(game, x, y, Spritesheets.arrow.key)

    this.animations.add('default', [0], 1, false)
    this.animations.add('hovered', [1], 1, false)

    this.enabled = true

    this.anchor = new Phaser.Point(0.5, 0.5)

    this.events.onInputOver.add(this.onInputOver, this)
    this.events.onInputOut.add(this.onInputOut, this)
  }

  public get enabled(): boolean {
    return this._enabled
  }

  public set enabled(value: boolean) {
    if (value === this.enabled) return
    this._enabled = value
    this.play('default')
    if (this.enabled) {
      this.inputEnabled = true
      this.input.useHandCursor = true
      this.alpha = 1
    } else {
      this.inputEnabled = false
      if (this.hovered) {
        this.game.canvas.style.cursor = 'default'
      }
      this.alpha = 0.6
    }
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
    this.play(this.enabled && this.hovered ? 'hovered' : 'default')
  }
}
