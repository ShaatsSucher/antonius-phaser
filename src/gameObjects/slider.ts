import { Button, ButtonState } from './button'
import { Atlases, Images } from '../assets'

export default class Slider extends Phaser.Group {
  private _value: number = 0.5
  public onValueChanged = new Phaser.Signal()
  public get value() { return this._value }
  public set value(value: number) {
    this._value = Math.max(0, Math.min(1, value))
    this.updateSlider()
    this.onValueChanged.dispatch(this.value)
  }

  private readonly sliderMin = 21
  private readonly sliderMax = 125

  private background: Phaser.Sprite
  private icon: Phaser.Sprite
  private sliderFill: Phaser.TileSprite
  private sliderHandle: Button

  constructor(game: Phaser.Game, iconKey: string = '') {
    super(game, null, 'slider')

    this.background = new Phaser.Sprite(game, 0, 0, Images.uiSliderBackground.key)
    this.add(this.background)

    this.icon = new Phaser.Sprite(game, 10, 7, iconKey)
    this.icon.anchor.setTo(0.5)
    if (this.icon.height % 2 === 1) {
      this.icon.y += 0.5
    }
    if (this.icon.width % 2 === 1) {
      this.icon.x += 0.5
    }
    this.add(this.icon)

    this.sliderFill = new Phaser.TileSprite(game, this.sliderMax - 1, 6, 52, 2, Images.uiSliderFill.key)
    this.sliderFill.anchor.set(1, 0)
    this.add(this.sliderFill)

    this.sliderHandle = new Button(game, 72, 2, Atlases.sliderHandle.key)
    this.sliderHandle.anchor.setTo(1, 0)
    this.registerDragHandlers()
    this.add(this.sliderHandle)

    this.updateSlider()
  }

  private updateSlider() {
    const fillWidth = (this.sliderMax - this.sliderMin) * this.value
    this.sliderFill.width = fillWidth
    this.sliderHandle.x = this.sliderMax - fillWidth
  }

  private onMouseMove(_, x: number) {
    if (this.sliderHandle.state !== ButtonState.DOWN) return
    x -= this.x
    this.sliderHandle.x = Math.max(this.sliderMin, Math.min(this.sliderMax, x))
    this.value = (this.sliderMax - this.sliderHandle.x) / (this.sliderMax - this.sliderMin)
  }

  public registerDragHandlers() {
    this.game.input.deleteMoveCallback(this.onMouseMove, this)
    this.game.input.addMoveCallback(this.onMouseMove, this)
  }
}
