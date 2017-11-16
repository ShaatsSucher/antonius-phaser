import { Button, ButtonState } from '../gameObjects/button'
import { Atlases, Images } from '../assets'
import Slider from '../gameObjects/slider'

import RestartOverlay from './restart'

import { AudioManager } from '../utils/audioManager'

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

  private masterVolumeSlider: Slider
  private musicVolumeSlider: Slider
  private atmoVolumeSlider: Slider
  private speechVolumeSlider: Slider

  private constructor(game: Phaser.Game) {
    super(game, null, 'settings overlay', true)
    this.visible = false

    // Add semi-transparent background
    const backgroundShading = this.game.make.graphics(0, 0)
    backgroundShading.beginFill(0x000000, 0.6)
    backgroundShading.drawRect(0, 0, game.canvas.width, game.canvas.height)
    backgroundShading.endFill()
    this.add(backgroundShading)

    const centerX = Math.floor(this.game.width / 2)
    const centerY = Math.floor(this.game.height / 2)

    const backgroundWidth = 150
    const backgroundHeight = 140

    const backgroundLeft = Math.floor(centerX - backgroundWidth / 2)
    const backgroundTop = Math.floor(centerY - backgroundHeight / 2)
    const backgroundBottom = Math.floor(centerY + backgroundHeight / 2)

    this.addMultiple([
      new Phaser.Sprite(game, backgroundLeft, backgroundTop, Atlases.settingsBackground.key, Atlases.settingsBackground.frames.top),
      new Phaser.TileSprite(game, backgroundLeft, backgroundTop + 2, backgroundWidth, backgroundHeight - 5, Atlases.settingsBackground.key, Atlases.settingsBackground.frames.center),
      new Phaser.Sprite(game, backgroundLeft, backgroundBottom - 3, Atlases.settingsBackground.key, Atlases.settingsBackground.frames.bottom)
    ])

    const confirmButton = new Button(this.game, centerX - 35, backgroundBottom - 16, Atlases.button.key)
    confirmButton.events.onInputUp.add(() => {
      this.hide(false)
    })
    const checkmarkIcon = new Phaser.Sprite(this.game, centerX - 40, backgroundBottom - 21, Images.iconsCheckmark.key)
    confirmButton.onStateChanged.add(state => {
      checkmarkIcon.y = backgroundBottom - (state === ButtonState.DOWN ? 20 : 21)
    })
    this.add(confirmButton)
    this.add(checkmarkIcon)

    const abortButton = new Button(this.game, centerX + 35, backgroundBottom - 16, Atlases.button.key)
    abortButton.events.onInputUp.add(() => {
      this.hide(true)
    })
    const crossIcon = new Phaser.Sprite(this.game, centerX + 31, backgroundBottom - 21, Images.iconsCross.key)
    abortButton.onStateChanged.add(state => {
      crossIcon.y = backgroundBottom - (state === ButtonState.DOWN ? 20 : 21)
    })
    this.add(abortButton)
    this.add(crossIcon)

    const restartButton = new Button(this.game, centerX, backgroundTop + 103, Atlases.wideButton.key)
    restartButton.events.onInputUp.add(() => {
      this.hide()
      RestartOverlay.instance.show()
    })
    const restartIcon = new Phaser.Sprite(this.game, centerX - 3, backgroundTop + 98, Images.iconsRestart.key)
    restartButton.onStateChanged.add(state => {
      restartIcon.y = backgroundTop + (state === ButtonState.DOWN ? 99 : 98)
    })
    this.add(restartButton)
    this.add(restartIcon)

    this.masterVolumeSlider = new Slider(this.game, Images.iconsSpeaker.key)
    this.masterVolumeSlider.position.setTo(centerX - 66, backgroundTop + 8)
    this.masterVolumeSlider.onValueChanged.add(value => {
      AudioManager.instance.master = value
    })
    this.add(this.masterVolumeSlider)

    this.musicVolumeSlider = new Slider(this.game, Images.iconsMusic.key)
    this.musicVolumeSlider.position.setTo(centerX - 66, backgroundTop + 30)
    this.musicVolumeSlider.onValueChanged.add(value => {
      AudioManager.instance.tracks.music.volume = value
    })
    this.add(this.musicVolumeSlider)

    this.atmoVolumeSlider = new Slider(this.game, Images.iconsAtmo.key)
    this.atmoVolumeSlider.position.setTo(centerX - 66, backgroundTop + 52)
    this.atmoVolumeSlider.onValueChanged.add(value => {
      AudioManager.instance.tracks.atmo.volume = value
    })
    this.add(this.atmoVolumeSlider)

    this.speechVolumeSlider = new Slider(this.game, Images.iconsSpeech.key)
    this.speechVolumeSlider.position.setTo(centerX - 66, backgroundTop + 74)
    this.speechVolumeSlider.onValueChanged.add(value => {
      AudioManager.instance.tracks.speech.volume = value
    })
    this.add(this.speechVolumeSlider)
  }

  private oldState: {
    masterVolume: number,
    musicVolume: number,
    atmoVolume: number,
    speechVolume: number
  }

  public show(): Promise<void> {
    this.visible = true
    ; [
      this.masterVolumeSlider,
      this.musicVolumeSlider,
      this.atmoVolumeSlider,
      this.speechVolumeSlider
    ].forEach(slider => slider.registerDragHandlers())

    this.masterVolumeSlider.value = AudioManager.instance.master
    this.musicVolumeSlider.value = AudioManager.instance.tracks.music.volume
    this.atmoVolumeSlider.value = AudioManager.instance.tracks.atmo.volume
    this.speechVolumeSlider.value = AudioManager.instance.tracks.speech.volume

    this.oldState = {
      masterVolume: AudioManager.instance.master,
      musicVolume: AudioManager.instance.tracks.music.volume,
      atmoVolume: AudioManager.instance.tracks.atmo.volume,
      speechVolume: AudioManager.instance.tracks.speech.volume
    }
    return this.onMenuClosed.asPromise()
  }

  public hide(resetSettings: boolean = false) {
    if (resetSettings && this.oldState) {
      this.masterVolumeSlider.value = this.oldState.masterVolume
      this.musicVolumeSlider.value = this.oldState.musicVolume
      this.atmoVolumeSlider.value = this.oldState.atmoVolume
      this.speechVolumeSlider.value = this.oldState.speechVolume
    }

    this.visible = false
    this.onMenuClosed.dispatch()
  }
}
