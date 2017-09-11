import { Button } from '../../gameObjects/button'
import { Atlases } from '../../assets'
import Character from '../../characters/character'
import GameObject from '../../gameObjects/gameObject'

import SettingsOverlay from '../../overlays/settings'
import Inventory from '../../overlays/inventory'

import { SceneStateManager } from '../../utils/stateManager'
import { AudioManager } from '../../utils/audioManager'

export default abstract class Scene extends Phaser.State {
  private _isVisible = false
  public get isVisible() { return this._isVisible }

  public readonly tweens: Phaser.TweenManager

  abstract stateManagers: { [name: string]: SceneStateManager<Scene> }
  public get defaultStateManager(): SceneStateManager<Scene> {
    return this.stateManagers.default
  }

  public abstract characters: { [name: string]: Character }
  public get allCharacters(): Character[] {
    return Object.keys(this.characters)
      .map(key => this.characters[key])
  }
  public abstract interactiveObjects: { [name: string]: GameObject }
  public get allInteractiveObjects(): GameObject[] {
    return Object.keys(this.interactiveObjects)
      .map(key => this.interactiveObjects[key])
      .concat(this.allCharacters)
  }
  private lastInteractiveObjects: GameObject[] = []

  private atmoKeys: string[]
  private musicKeys: string[]

  private backgroundImage: Phaser.Sprite

  public settingsButton: Button

  public onUpdate = new Phaser.Signal()
  public onCreate = new Phaser.Signal()
  public onShutdown = new Phaser.Signal()

  constructor(game: Phaser.Game, private backgroundKey,
              atmoKeys: string | string[] = [], musicKeys: string | string[] = []) {
    super()

    this.tweens = new Phaser.TweenManager(game)

    this.atmoKeys = Array.isArray(atmoKeys) ? atmoKeys : [atmoKeys]
    this.musicKeys = Array.isArray(musicKeys) ? musicKeys : [musicKeys]
  }

  public getScene<T extends Scene>(name: string): T {
    return <T>this.state.states[name]
  }

  public setBackgroundImage(key: string) {
    this.backgroundKey = key
    this.backgroundImage.loadTexture(key)
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

    // Start the next state as soon as the fade-out is done
    this.game.camera.onFadeComplete.addOnce(() => {
      this.game.state.start(nextScene)
    })

    // Fade out
    this.camera.resetFX()
    this.camera.fade(0x000000, 1000)
    this.tweens.create(Inventory.instance).to({ alpha: 0 }, 1000).start()

    // Transition audio tracks as needed
    const targetScene = this.game.state.states[nextScene] as Scene
    AudioManager.instance.tracks.atmo.fadeAll(targetScene.atmoClips, 1, 2, true)
    AudioManager.instance.tracks.music.fadeAll(targetScene.musicClips, 1, 2, true)
  }

  protected abstract createGameObjects(): void

  public lockInput() {
    this.allInteractiveObjects
      .forEach(object => object.isPaused.value = true)
  }

  public releaseInput() {
    this.allInteractiveObjects
      .forEach(object => object.isPaused.value = false)
  }

  public create() {
    this.lockInput()
    this.camera.resetFX()
    this.camera.flash(0x000000, 1000)
    this.game.tweens.create(Inventory.instance).to({ alpha: 1 }, 1000).start()

    this.backgroundImage = this.add.sprite(0, 0, this.backgroundKey)

    this.settingsButton = new Button(this.game, 0, 0, Atlases.wrench.key)
    this.settingsButton.x = this.game.canvas.width - 2 - this.settingsButton.width / 2
    this.settingsButton.y = 2 + this.settingsButton.height / 2
    this.settingsButton.interactionEnabled = true
    this.add.existing(this.settingsButton)
    this.settingsButton.events.onInputUp.add(() => {
      this.releaseInput()
      SettingsOverlay.instance.show()
    })

    this.createGameObjects()

    // Make sure nothing can obstruct the settings button
    this.settingsButton.bringToTop()

    this.releaseInput()
    this._isVisible = true

    // Start atmo and music clips
    AudioManager.instance.tracks.atmo.fadeAll(this.atmoKeys, 1, 1, true)
    AudioManager.instance.tracks.music.fadeAll(this.musicKeys, 1, 1, true)

    this.onCreate.dispatch()
  }

  public update() {
    this.onUpdate.dispatch()
  }

  public shutdown() {
    this._isVisible = false

    this.onShutdown.dispatch()
  }
}
