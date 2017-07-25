import { Button } from '../../gameObjects/button'
import { Atlases } from '../../assets'

import SettingsOverlay from '../../overlays/settings'
import Inventory from '../../overlays/inventory'

import { SceneStateManager } from '../../utils/stateManager'

export default abstract class Scene extends Phaser.State {
  private _isVisible = false
  public get isVisible() { return this._isVisible }

  abstract stateManagers: { [name: string]: SceneStateManager<Scene> }
  public get defaultStateManager(): SceneStateManager<Scene> {
    return this.stateManagers.default
  }

  private activeBackgroundSounds: { [type: string]: { key: string, sound: Phaser.Sound } } = { }
  private backgroundSoundVolumeMultiplier = 0.5

  private backgroundImage: Phaser.Sprite

  public settingsButton: Button

  public onUpdate = new Phaser.Signal()
  public onCreate = new Phaser.Signal()
  public onShutdown = new Phaser.Signal()

  constructor(private backgroundKey = '') {
    super()
  }

  public getScene<T extends Scene>(name: string): T {
    return <T>this.state.states[name]
  }

  public setBackgroundImage(key: string) {
    this.backgroundKey = key
    this.backgroundImage.loadTexture(key)
  }

  public playAtmo(key: string): Promise<Phaser.Sound> {
    return this.playBackgroundSound('atmo', key)
  }

  public stopAtmo(): Promise<void> {
    return this.stopBackgroundSound('atmo')
  }

  public getAtmo(): Phaser.Sound {
    return this.getBackgroundSound('atmo')
  }

  public playMusic(key: string): Promise<Phaser.Sound> {
    return this.playBackgroundSound('music', key)
  }

  public stopMusic(): Promise<void> {
    return this.stopBackgroundSound('music')
  }

  public getMusic(): Phaser.Sound {
    return this.getBackgroundSound('music')
  }

  public playBackgroundSound(type: string, key: string,
        fadeIn: boolean = true, loop = true): Promise<Phaser.Sound> {
    const activeSound = this.activeBackgroundSounds[type]

    if (activeSound && activeSound.key === key) {
      // Don't do anything, if the selected sound is already active
      return Promise.resolve(activeSound.sound)
    }

    // Fade out the previously active sound (if any)
    if (activeSound) {
      const oldSound = activeSound.sound
      oldSound.fadeOut(1000)
      oldSound.onFadeComplete.addOnce(() => oldSound.destroy())
    }

    // Fade in the new sound
    const sound = this.game.sound.play(key, fadeIn ? 0 : 1, loop)
    this.activeBackgroundSounds[type] = { key, sound }

    if (fadeIn) {
      let fadeInDone: (sound: Phaser.Sound) => void
      const fadeInComplete = new Promise<Phaser.Sound>(resolve => { fadeInDone = resolve })

      sound.fadeTo(1000, this.game.sound.volume * this.backgroundSoundVolumeMultiplier)
      sound.onFadeComplete.addOnce(() => fadeInDone(sound))

      return fadeInComplete
    } else {
      return Promise.resolve(sound)
    }
  }

  public stopBackgroundSound(type: string): Promise<void> {
    const activeSound = this.activeBackgroundSounds[type]
    if (!activeSound) return Promise.resolve()

    let fadeOutDone: () => void
    const fadeOutComplete = new Promise<void>(resolve => { fadeOutDone = resolve })

    activeSound.sound.fadeOut(1000)
    activeSound.sound.onFadeComplete.addOnce(() => {
      delete this.activeBackgroundSounds[type]
    })
    activeSound.sound.onFadeComplete.addOnce(fadeOutDone)

    return fadeOutComplete
  }

  public killBackgroundSound(type: string) {
    const activeSound = this.activeBackgroundSounds[type]
    if (!activeSound) return
    activeSound.sound.stop()
    activeSound.sound.destroy()
    delete this.activeBackgroundSounds[type]
    return
  }

  public stopAllBackgroundSounds(): Promise<void> {
    return Promise.all(
      Object.keys(this.activeBackgroundSounds).map(type => this.stopBackgroundSound(type))
    ).then(() => {}) // Clear void[] type
  }

  public killAllBackgroundSounds() {
    Object.keys(this.activeBackgroundSounds).forEach(type => this.killBackgroundSound(type))
  }

  public getBackgroundSound(key: string): Phaser.Sound {
    const sound = this.activeBackgroundSounds[key]
    return sound && sound.sound
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
    this.game.tweens.create(Inventory.instance).to({ alpha: 0 }, 1000).start()
    this.stopAllBackgroundSounds()
  }

  protected abstract createGameObjects(): void

  public lockInput() {
    this.game.input.enabled = false
  }

  public releaseInput() {
    this.game.input.enabled = true
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

    this.onCreate.dispatch()
  }

  public update() {
    this.onUpdate.dispatch()
  }

  public shutdown() {
    this._isVisible = false
    this.killAllBackgroundSounds()

    this.onShutdown.dispatch()
  }
}
