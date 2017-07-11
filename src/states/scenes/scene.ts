import SceneState from './sceneState'
import { Button } from '../../gameObjects/button'
import { Atlases } from '../../assets'
import SettingsOverlay from '../../overlays/settings'

export default abstract class Scene extends Phaser.State {
  private isVisible = false
  private states: { [name: string]: SceneState<Scene> }
  private _activeState: SceneState<Scene>

  private activeBackgroundSounds: { [type: string]: { key: string, sound: Phaser.Sound } } = { }
  private backgroundSoundVolumeMultiplier = 0.5

  private backgroundImage: Phaser.Sprite

  public onUpdate = new Phaser.Signal()

  constructor(private backgroundKey = '', ...states: (new (Scene) => SceneState<Scene>)[]) {
    super()

    const concreteStates = states.map(State => new State(this))
    this.states = concreteStates.reduce((acc, state) => {
      acc[state.getStateName()] = state
      return acc
    }, { })
    this._activeState = concreteStates[0]
  }

  public getScene<T extends Scene>(name: string): T {
    return <T>this.state.states[name]
  }

  public setBackgroundImage(key: string) {
    this.backgroundKey = key
    this.backgroundImage.loadTexture(key)
  }

  public playAtmo(key: string): Promise<void> {
    return this.playBackgroundSound('atmo', key)
  }

  public stopAtmo(): Promise<void> {
    return this.stopBackgroundSound('atmo')
  }

  public getAtmo(): Phaser.Sound {
    return this.getBackgroundSound('atmo')
  }

  public playMusic(key: string): Promise<void> {
    return this.playBackgroundSound('music', key)
  }

  public stopMusic(): Promise<void> {
    return this.stopBackgroundSound('music')
  }

  public getMusic(): Phaser.Sound {
    return this.getBackgroundSound('music')
  }

  public playBackgroundSound(type: string, key: string): Promise<void> {
    const activeSound = this.activeBackgroundSounds[type]
    if (activeSound && activeSound.key === key) {
      // Don't do anything, if the selected sound is already active
      return Promise.resolve()
    }

    // Fade out the previously active sound (if any)
    if (activeSound) {
      const oldSound = activeSound.sound
      oldSound.fadeOut(1000)
      oldSound.onFadeComplete.addOnce(() => oldSound.destroy())
    }

    // Fade in the new sound
    let fadeInDone: () => void
    const fadeInComplete = new Promise<void>(resolve => { fadeInDone = resolve })

    const sound = this.game.sound.play(key, 0, true)
    sound.fadeTo(1000, this.game.sound.volume * this.backgroundSoundVolumeMultiplier)
    sound.onFadeComplete.addOnce(fadeInDone)

    this.activeBackgroundSounds[type] = { key, sound }

    return fadeInComplete
  }

  public stopBackgroundSound(type: string): Promise<void> {
    const activeSound = this.activeBackgroundSounds[type]
    if (!activeSound) return Promise.resolve()

    let fadeOutDone: () => void
    const fadeOutComplete = new Promise<void>(resolve => { fadeOutDone = resolve })

    activeSound.sound.fadeOut(1000)
    activeSound.sound.onFadeComplete.addOnce(fadeOutDone)

    this.activeBackgroundSounds[type] = undefined

    return fadeOutComplete
  }

  public killBackgroundSound(type: string) {
    const activeSound = this.activeBackgroundSounds[type]
    if (!activeSound) return
    activeSound.sound.stop()
    activeSound.sound.destroy()
    this.activeBackgroundSounds[type] = undefined
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

  async setActiveState(name: string): Promise<void> {
    if (!this.states[name]) {
      throw `Invalid state '${name}'`
    }
    if (this.activeState && this.activeState.exit) {
      await this.activeState.exit()
    }
    this._activeState = this.states[name]
    if (this.isVisible) {
      await this.activeState.enter()
    }
  }

  get activeState(): SceneState<Scene> {
    return this._activeState
  }

  public async fadeTo(nextScene: string): Promise<void> {
    // Disable all inputs to prevent the user to do anything stupid
    this.lockInput()

    // Start the next state as soon as the fade-out is done
    this.game.camera.onFadeComplete.addOnce(() => {
      this.game.state.start(nextScene)
    })

    // Fade out
    this.camera.fade(0x000000, 1000)
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
    this.camera.flash(0x000000, 1000)

    console.log(`Adding background '${this.backgroundKey}'`)
    this.backgroundImage = this.add.sprite(0, 0, this.backgroundKey)

    this.createGameObjects()

    const settingsButton = new Button(this.game, 0, 0, Atlases.wrench.key)
    settingsButton.x = this.game.canvas.width - 2 - settingsButton.width / 2
    settingsButton.y = 2 + settingsButton.height / 2
    settingsButton.interactionEnabled = true
    this.add.existing(settingsButton)
    settingsButton.events.onInputUp.add(() => {
      this.releaseInput()
      SettingsOverlay.instance.show()
    })

    this.releaseInput()
    this.isVisible = true
    this.activeState.enter()
  }

  public update() {
    this.onUpdate.dispatch()
  }

  public shutdown() {
    this.isVisible = false
    this.killAllBackgroundSounds()
  }
}
