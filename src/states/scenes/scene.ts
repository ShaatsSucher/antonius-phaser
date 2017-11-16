import { Button } from '../../gameObjects/button'
import { Atlases, Json } from '../../assets'
import Character from '../../characters/character'
import GameObject from '../../gameObjects/gameObject'

import SettingsOverlay from '../../overlays/settings'
import RestartOverlay from '../../overlays/restart'
import Inventory from '../../overlays/inventory'

import { SceneStateManager } from '../../utils/stateManager'
import { AudioManager } from '../../utils/audioManager'
import { Pausable } from '../../utils/pausable'
import { Property } from '../../utils/property'

export default abstract class Scene extends Phaser.State implements Pausable {
  private _isVisible = false
  public get isVisible() { return this._isVisible }

  public readonly isPaused = new Property<boolean>(false)

  public readonly tweens: Phaser.TweenManager

  abstract stateManagers: { [name: string]: SceneStateManager<Scene> }

  public abstract characters: { [name: string]: Character }
  public get allCharacters(): Character[] {
    return Object.keys(this.characters)
      .map(key => this.characters[key])
  }
  public abstract interactiveObjects: { [name: string]: GameObject }
  public get allInteractiveObjects(): GameObject[] {
    return Object.keys(this.interactiveObjects)
      .map(key => this.interactiveObjects[key])
  }
  private lastInteractiveObjects: GameObject[] = []

  private atmoKeys: string[]
  private musicKeys: string[]

  private dialogs: { [name: string]: [string, string | string[] | string[][], any | any[]][] } = {}

  private backgroundImage: Phaser.Sprite

  public settingsButton: Button
  public inventoryButton: Button

  public onUpdate = new Phaser.Signal()
  public onCreate = new Phaser.Signal()
  public onShutdown = new Phaser.Signal()

  constructor(game: Phaser.Game, private backgroundKey,
              atmoKeys: string | string[] = [], musicKeys: string | string[] = [], dialogJsonKey?: string) {
    super()

    this.tweens = new Phaser.TweenManager(game)

    this.atmoKeys = Array.isArray(atmoKeys) ? atmoKeys : [atmoKeys]
    this.musicKeys = Array.isArray(musicKeys) ? musicKeys : [musicKeys]

    this.isPaused.onValueChanged.add(isPaused => {
      if (isPaused) {
        this.lockInput()
        this.tweens.pauseAll()
      } else {
        this.releaseInput()
        this.tweens.resumeAll()
      }
      this.settingsButton.isPaused.value = isPaused
      this.inventoryButton.isPaused.value = isPaused
    })

    if (dialogJsonKey) {
      this.dialogs = game.cache.getJSON(dialogJsonKey)
    }
  }

  public getScene<T extends Scene>(name: string): T {
    return <T>this.state.states[name]
  }

  public get atmoClips(): string[] {
    return this.atmoKeys
  }
  public setAtmoClips(keys: string | string[]): Promise<void> {
    this.atmoKeys = Array.isArray(keys) ? keys : [keys]
    return AudioManager.instance.tracks.atmo.crossFadeAll(this.atmoKeys, 1, 1, true)
  }

  public get musicClips(): string[] {
    return this.musicKeys
  }
  public setMusicClips(keys: string | string[]): Promise<void> {
    this.musicKeys = Array.isArray(keys) ? keys : [keys]
    return AudioManager.instance.tracks.music.crossFadeAll(this.musicKeys, 1, 1, true)
  }

  public async fadeTo(nextScene: string): Promise<void> {
    // Disable all inputs to prevent the user from doing anything stupid.
    this.lockInput()
    this.settingsButton.isPaused.value = true
    this.inventoryButton.isPaused.value = true

    // Start the next state as soon as the fade-out is done
    this.game.camera.onFadeComplete.addOnce(() => {
      this.game.state.start(nextScene)
    })

    // Fade out
    this.camera.resetFX()
    this.camera.fade(0x000000, 1000)

    // Transition audio tracks as needed
    const targetScene = this.game.state.states[nextScene] as Scene
    AudioManager.instance.tracks.atmo.fadeAll(targetScene.atmoClips, 1, 2, true)
    AudioManager.instance.tracks.music.fadeAll(targetScene.musicClips, 1, 2, true)
  }

  protected registerConditionalStateTransitions(scenes: { [title: string]: Scene}): void { }
  protected abstract createGameObjects(): void

  public lockInput() {
    this.allInteractiveObjects.concat(this.allCharacters)
      .forEach(object => object.isPaused.value = true)
  }

  public releaseInput() {
    this.allInteractiveObjects.concat(this.allCharacters)
      .forEach(object => object.isPaused.value = false)
  }

  public disableInteraction() {
    const interactableObjects = this.allInteractiveObjects.filter(obj => obj.interactionEnabled)
    interactableObjects.forEach(obj => obj.interactionEnabled = false)
    return () => {
      interactableObjects.forEach(obj => obj.interactionEnabled = true)
    }
  }

  public create() {
    this.backgroundImage = this.add.sprite(0, 0, this.backgroundKey)

    this.settingsButton = new Button(this.game, 0, 0, Atlases.wrench.key)
    this.settingsButton.x = this.game.canvas.width - 2 - this.settingsButton.width / 2
    this.settingsButton.y = 2 + this.settingsButton.height / 2
    this.settingsButton.interactionEnabled = false
    this.add.existing(this.settingsButton)

    this.settingsButton.events.onInputDown.add(() => {
      this.isPaused.value = true
      SettingsOverlay.instance.show().then(() => {
        this.isPaused.value = false || RestartOverlay.instance.isShowing.value
      })
    })

    this.inventoryButton = new Button(this.game, 0, 0, Atlases.bag.key)
    this.inventoryButton.x = this.game.width - 2 - this.inventoryButton.width / 2
    this.inventoryButton.y = this.game.height - 2 - this.inventoryButton.height / 2
    this.inventoryButton.interactionEnabled = false
    this.add.existing(this.inventoryButton)

    this.inventoryButton.events.onInputDown.add(() => {
      this.isPaused.value = true
      this.clickedAnywhere(true).then(() => {
        Inventory.instance.hide()
        this.isPaused.value = false || RestartOverlay.instance.isShowing.value
      })
      Inventory.instance.show()
    })

    RestartOverlay.instance.isShowing.onValueChanged.add(value => {
      if (this.isVisible) {
        console.log('RestartOverlay isShowing changed to', value)
        if (!SettingsOverlay.instance.visible) {
          this.isPaused.value = value
        }
      }
    })
    RestartOverlay.instance.timeoutEnabled = true

    // Make sure nothing can obstruct the settings and inventory buttons
    this.settingsButton.bringToTop()
    this.inventoryButton.bringToTop()

    this.createGameObjects()
    this.lockInput()

    this.releaseInput()
    this._isVisible = true

    // Start atmo and music clips
    AudioManager.instance.tracks.atmo.fadeAll(this.atmoKeys, 1, 1, true)
    AudioManager.instance.tracks.music.fadeAll(this.musicKeys, 1, 1, true)

    // Fade in scene
    this.camera.resetFX()
    this.camera.flash(0x000000, 1000)

    this.settingsButton.isPaused.value = true
    this.inventoryButton.isPaused.value = true
    this.camera.onFlashComplete.asPromise().then(() => {
      this.settingsButton.isPaused.value = false
      this.inventoryButton.isPaused.value = false
    }).then(() => {
      this.settingsButton.interactionEnabled = true
      this.inventoryButton.interactionEnabled = true
    })

    this.onCreate.dispatch()
  }

  public update() {
    this.onUpdate.dispatch()
  }

  public shutdown() {
    this._isVisible = false

    RestartOverlay.instance.timeoutEnabled = true

    this.onShutdown.dispatch()
  }

  public async resetStates() {
    await Promise.all(
      Object.keys(this.stateManagers)
        .map(key => this.stateManagers[key])
        .map(sm => sm.resetStates()))
  }

  public async playDialogJson(key: string) {
    const dialog = this.dialogs[key]
    if (dialog) {
      await this.playDialog.apply(this, dialog)
    }
  }

  public async playDialog(...lines: [string, string | string[] | string[][], any | any[]][]) {
    for (const line of lines) {
      const character = this.characters[line[0]]

      const rawParams = line[2]
      const speechParams = Array.isArray(rawParams) ? rawParams : [rawParams]

      const rawText: string | string[] | string[][] = line[1]
      let lines: string[]
      if (Array.isArray(rawText)) {
        if (Array.isArray(rawText[1])) {
          lines = Phaser.ArrayUtils.getRandomItem(<string[][]>rawText)
        } else {
          lines = <string[]>rawText
        }
      } else {
        lines = [rawText]
      }
      const text = lines.join('\n')

      await character.speech.say.apply(character.speech, [text].concat(speechParams))
    }
  }

  public clickedAnywhere(ignorePause: boolean = false): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      let mouseWasUp = false
      let mouseWasDown = false
      let handle: Phaser.SignalBinding
      handle = this.onUpdate.add(() => {
        if (!ignorePause && this.isPaused.value) {
          mouseWasUp = false
          mouseWasDown = false
        }
        if (!this.game.input.activePointer.leftButton.isDown) {
          mouseWasUp = true
        }
        if (mouseWasUp && this.game.input.activePointer.leftButton.isDown) {
          mouseWasDown = true
        }
        if (mouseWasDown && !this.game.input.activePointer.leftButton.isDown) {
          this.game.input.mouse.capture = false
          handle.detach()
          resolve()
        }
      })
    })
  }

  public wait(seconds: number): Promise<void> {
    return new Promise<void>(resolve => {
      const timer = this.game.time.create()
      const pauseHandler = this.isPaused.onValueChanged.add(isPaused => {
        if (isPaused) {
          timer.pause()
        } else {
          timer.resume()
        }
      })
      timer.add(seconds * Phaser.Timer.SECOND, () => {
        pauseHandler.detach()
        resolve()
        timer.destroy()
      })
      timer.start()
    })
  }
}
