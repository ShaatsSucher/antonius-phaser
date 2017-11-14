import { Button, ButtonState } from '../gameObjects/button'
import { Atlases, CustomWebFonts, Images } from '../assets'
import Slider from '../gameObjects/slider'

import { Property } from '../utils/property'

import { AudioManager } from '../utils/audioManager'

export default class RestartOverlay extends Phaser.Group {
  /* Singleton-related */

  private static _instance: RestartOverlay = null
  public static get instance(): RestartOverlay {
    if (!RestartOverlay.initialized) {
      throw 'SettingsOverlay is not yet initialised'
    }
    return RestartOverlay._instance
  }

  public static get initialized(): boolean {
    return !!RestartOverlay._instance
  }

  public static init(game: Phaser.Game) {
    if (RestartOverlay.initialized) {
      throw 'RestartOverlay is already initialised'
    }
    RestartOverlay._instance = new RestartOverlay(game)
  }

  /* Actual Class */

  public readonly AUTORESTART_DELAY = 1

  public onMenuClosed = new Phaser.Signal()

  private _timeoutEnabled = false
  private timeoutEnabledBeforeShowing = true

  private timeoutTimer: Phaser.Timer

  public readonly isShowing = new Property(true)

  private constructor(game: Phaser.Game) {
    super(game, null, 'restart overlay', true)

    this.isShowing.onValueChanged.add(value => {
      if (value) {
        this.show()
      } else {
        this.hide()
      }
    })
    this.isShowing.value = false

    // Add semi-transparent background
    const backgroundShading = this.game.make.graphics(0, 0)
    backgroundShading.beginFill(0x000000, 0.6)
    backgroundShading.drawRect(0, 0, game.canvas.width, game.canvas.height)
    backgroundShading.endFill()
    this.add(backgroundShading)

    const centerX = Math.floor(this.game.width / 2)
    const centerY = Math.floor(this.game.height / 2)

    const backgroundWidth = 150
    const backgroundHeight = 49

    const backgroundLeft = Math.floor(centerX - backgroundWidth / 2)
    const backgroundTop = Math.floor(centerY - backgroundHeight / 2)
    const backgroundBottom = Math.floor(centerY + backgroundHeight / 2)

    this.addMultiple([
      new Phaser.Sprite(game, backgroundLeft, backgroundTop, Atlases.settingsBackground.key, Atlases.settingsBackground.frames.top),
      new Phaser.TileSprite(game, backgroundLeft, backgroundTop + 2, backgroundWidth, backgroundHeight - 5, Atlases.settingsBackground.key, Atlases.settingsBackground.frames.center),
      new Phaser.Sprite(game, backgroundLeft, backgroundBottom - 3, Atlases.settingsBackground.key, Atlases.settingsBackground.frames.bottom)
    ])

    const textStyle = {
      font: `8px ${CustomWebFonts.pixelOperator8Bold.family}`,
      fill: '#fff',
      stroke: '#000',
      strokeThickness: 2
    }
    const restartText = new Phaser.Text(
      this.game,
      centerX,
      backgroundTop + 17,
      'Spiel neu starten?',
      textStyle
    )
    restartText.anchor.setTo(0.5)
    this.add(restartText)

    const confirmButton = new Button(this.game, centerX - 35, backgroundBottom - 16, Atlases.button.key)
    confirmButton.events.onInputUp.add(() => {
      this.hide()
      this.game.state.start('reset')
    })
    const checkmarkIcon = new Phaser.Sprite(this.game, centerX - 40, backgroundBottom - 21, Images.iconsCheckmark.key)
    confirmButton.onStateChanged.add(state => {
      checkmarkIcon.y = backgroundBottom - (state === ButtonState.DOWN ? 20 : 21)
    })
    this.add(confirmButton)
    this.add(checkmarkIcon)

    const abortButton = new Button(this.game, centerX + 35, backgroundBottom - 16, Atlases.button.key)
    abortButton.events.onInputUp.add(() => {
      this.hide()
    })
    const crossIcon = new Phaser.Sprite(this.game, centerX + 31, backgroundBottom - 21, Images.iconsCross.key)
    abortButton.onStateChanged.add(state => {
      crossIcon.y = backgroundBottom - (state === ButtonState.DOWN ? 20 : 21)
    })
    this.add(abortButton)
    this.add(crossIcon)
  }

  public get timeoutEnabled() {
    return this._timeoutEnabled
  }

  public set timeoutEnabled(value: boolean) {
    console.log('Setting timeoutEnabled to', value)
    this._timeoutEnabled = value
    if (!this.isShowing.value) {
      this.timeoutEnabledBeforeShowing = value
    }

    this.game.input.onDown.add(this.resetTimeout, this)
    this.game.input.keyboard.addCallbacks(this, this.resetTimeout, this.resetTimeout)

    this.resetTimeout()
  }

  private resetTimeout() {
    if (this.timeoutTimer) {
      this.timeoutTimer.destroy()
    }
    if (this.timeoutEnabled) {
      this.timeoutTimer = this.game.time.create()
      this.timeoutTimer.add(this.AUTORESTART_DELAY * Phaser.Timer.SECOND, this.show, this)
      this.timeoutTimer.start()
    }
  }

  public show(): Promise<void> {
    console.log('Showing RestartOverlay')
    this.isShowing.value = this.visible = true
    this.timeoutEnabled = false
    return this.onMenuClosed.asPromise()
  }

  public hide() {
    console.log('Hiding RestartOverlay')
    this.isShowing.value = this.visible = false
    this.timeoutEnabled = this.timeoutEnabledBeforeShowing
    this.onMenuClosed.dispatch()
  }
}
