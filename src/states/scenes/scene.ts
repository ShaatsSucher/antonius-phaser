import SceneState from './sceneState'

export default abstract class Scene extends Phaser.State {
  private isVisible = false
  private states: { [name: string]: SceneState<Scene> }
  private _activeState: SceneState<Scene>

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

    this.releaseInput()
    this.isVisible = true
    this.activeState.enter()
  }

  public update() {
    this.onUpdate.dispatch()
  }

  public shutdown() {
    this.isVisible = false
  }
}
