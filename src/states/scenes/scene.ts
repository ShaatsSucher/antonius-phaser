import SceneState from './sceneState'

export default abstract class Scene extends Phaser.State {
  private states: { [name: string]: SceneState<Scene> }
  private _activeState: SceneState<Scene>

  private backgroundImage: Phaser.Sprite

  constructor(private backgroundKey = '', ...states: (new (Scene) => SceneState<Scene>)[]) {
    super()

    const concreteStates = states.map(State => new State(this))
    this.states = concreteStates.reduce((acc, state) => {
      acc[state.getStateName()] = state
      return acc
    }, { })
    this._activeState = concreteStates[0]
  }

  setBackgroundImage(key: string) {
    this.backgroundKey = key
    this.backgroundImage.loadTexture(key)
  }

  async setActiveState(name: string): Promise<void> {
    if (!this.states[name]) {
      throw `Invalid state '${name}'`
    }
    if (this.activeState && this.activeState.exit) {
      await this.activeState.exit()
    }
    this._activeState = this.states[name]
    await this.activeState.enter()
  }

  get activeState(): SceneState<Scene> {
    return this._activeState
  }

  public async fadeTo(nextScene: string): Promise<void> {
    // Disable all inputs to prevent the user to do anything stupid
    this.game.input.enabled = false

    // Start the next state as soon as the fade-out is done
    this.game.camera.onFadeComplete.addOnce(() => {
      this.game.state.start(nextScene)
    })

    // Fade out
    this.game.camera.fade(0x000000, 1000)
  }

  protected abstract createGameObjects(): void

  public create() {
    this.game.input.enabled = false
    this.camera.flash(0x000000, 1000)

    console.log(`Adding background '${this.backgroundKey}'`)
    this.backgroundImage = this.add.sprite(0, 0, this.backgroundKey)

    this.createGameObjects()

    this.game.input.enabled = true

    this.activeState.enter()
  }
}
