import { Pausable } from '../utils/pausable'
import { Property } from '../utils/property'

export default class GameObject extends Phaser.Sprite implements Pausable {
  private _interactionEnabled: boolean

  public readonly isPaused = new Property<boolean>(false)
  public onUpdate = new Phaser.Signal()

  constructor(game: Phaser.Game, x: number, y: number,
              key?: string | Phaser.RenderTexture | Phaser.BitmapData | PIXI.Texture,
              frame?: string | number) {
    super(game, x, y, key, frame)

    let wasInteractive = false
    this.isPaused.onValueChanged.add(isPaused => {
      if (isPaused) {
        wasInteractive = this.interactionEnabled
        this.interactionEnabled = false
      } else {
        this.interactionEnabled = wasInteractive
      }
    })
  }

  public set interactionEnabled(value: boolean) {
    this.setInteractionEnabled(value)
  }

  public get interactionEnabled() {
    return this._interactionEnabled
  }

  public update() {
    this.onUpdate.dispatch()
  }

  public setInteractionEnabled(value: boolean) {
    // Account for Phaser quirk which sometimes leads to the InputHandler's sprite not being set
    if (this.input && !this.input.sprite) {
      console.warn('Invalid state: input sprite is not set')
      this.input.sprite = this
    }

    this._interactionEnabled = value
    this.inputEnabled = value
    if (value) {
      this.input.pixelPerfectOver = value
      this.input.pixelPerfectClick = value
      this.input.useHandCursor = value
    }
  }
}
