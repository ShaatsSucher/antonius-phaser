import GameObject from './gameObject'
import { Spritesheets } from '../assets'

export default class Button extends GameObject {
  private hovered = false

  constructor(game: Phaser.Game, x: number, y: number, key: string,
              defaultFrames: number[] = [0], hoverFrames: number[] = [1]) {
    super(game, x, y, key)

    this.animations.add('default', defaultFrames, 8, false)
    this.animations.add('hovered', hoverFrames, 8, false)

    this.anchor = new Phaser.Point(0.5, 0.5)

    this.events.onInputOver.add(this.onInputOver, this)
    this.events.onInputOut.add(this.onInputOut, this)
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
