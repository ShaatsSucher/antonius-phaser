import { Button, ButtonState } from '../gameObjects/button'
import { Atlases, Images } from '../assets'
import Slider from '../gameObjects/slider'

export default class SettingsOverlay extends Phaser.Group {
  /* Singleton-related */

  private static _instance: SettingsOverlay = null
  public static get instance(): SettingsOverlay {
    if (!SettingsOverlay.initialized) {
      throw 'SettingsOverlay is not yet initialised'
    }
    return SettingsOverlay._instance
  }

  public static get initialized(): boolean {
    return !!SettingsOverlay._instance
  }

  public static init(game: Phaser.Game) {
    if (SettingsOverlay.initialized) {
      throw 'SettingsOverlay is already initialised'
    }
    SettingsOverlay._instance = new SettingsOverlay(game)
  }

  /* Actual Class */

  public onMenuClosed = new Phaser.Signal()

  private volumeSlider: Slider
  private constructor(game: Phaser.Game) {
    super(game, null, 'settings overlay', true)
    this.visible = false

    // Add semi-transparent background
    const backgroundShading = this.game.make.graphics(0, 0)
    backgroundShading.beginFill(0x000000, 0.6)
    backgroundShading.drawRect(0, 0, game.canvas.width, game.canvas.height)
    backgroundShading.endFill()
    this.add(backgroundShading)

    this.addMultiple([
      new Phaser.Sprite(game, 117, 81, Atlases.settingsBackground.key, Atlases.settingsBackground.frames.top),
      new Phaser.TileSprite(game, 117, 83, 150, 49, Atlases.settingsBackground.key, Atlases.settingsBackground.frames.center),
      new Phaser.Sprite(game, 117, 132, Atlases.settingsBackground.key, Atlases.settingsBackground.frames.bottom)
    ])

    const confirmButton = new Button(this.game, 157, 120, Atlases.button.key)
    confirmButton.events.onInputUp.add(() => {
      this.hide(false)
    })
    const checkmarkIcon = new Phaser.Sprite(this.game, 152, 115, Images.iconsCheckmark.key)
    confirmButton.onStateChanged.add(state => {
      checkmarkIcon.y = state === ButtonState.DOWN ? 116 : 115
    })
    this.add(confirmButton)
    this.add(checkmarkIcon)

    const abortButton = new Button(this.game, 227, 120, Atlases.button.key)
    abortButton.events.onInputUp.add(() => {
      this.hide(true)
    })
    const crossIcon = new Phaser.Sprite(this.game, 223, 115, Images.iconsCross.key)
    abortButton.onStateChanged.add(state => {
      crossIcon.y = state === ButtonState.DOWN ? 116 : 115
    })
    this.add(abortButton)
    this.add(crossIcon)

    this.volumeSlider = new Slider(this.game, Images.iconsSpeaker.key)
    this.volumeSlider.position.setTo(126, 90)
    this.volumeSlider.value = this.game.sound.volume
    this.volumeSlider.onValueChanged.add(value => {
      this.game.sound.volume = value
    })
    this.add(this.volumeSlider)
  }

  private oldState: { volume: number }

  public show(): Promise<void> {
    this.visible = true
    this.volumeSlider.registerDragHandlers()
    this.oldState = {
      volume: this.game.sound.volume
    }
    return this.onMenuClosed.asPromise()
  }

  private hide(resetSettings: boolean) {
    if (resetSettings) {
      this.volumeSlider.value = this.oldState.volume
    }

    this.visible = false
    this.onMenuClosed.dispatch()
  }
}
