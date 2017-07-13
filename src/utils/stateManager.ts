import Scene from '../states/scenes/scene'

type Class<T> = new (...params) => T
export type Extending<T> = new<N extends T> (...params) => N

export abstract class SceneState<T extends Scene> {
  public constructor(
    protected readonly scene: T,
    protected readonly stateManager: SceneStateManager<T>
  ) { }

  public async enter(): Promise<void> { }
  public async show(): Promise<void> { }

  public async exit(): Promise<void> { }
  public async hide(): Promise<void> { }
}

export abstract class SceneStateTransition<T extends Scene> {
  public constructor(protected readonly scene: T) { }

  public abstract enter(isVisible: boolean): Promise<Extending<SceneState<T>>|Extending<SceneStateTransition<T>>>
}

export class SceneStateManager<T extends Scene> {
  private defaultState: SceneState<T>
  private states: { type: Extending<SceneState<T>>, instance: SceneState<T> }[] = []
  private activeState: SceneState<T>

  private transitions: { type: Extending<SceneStateTransition<T>>, instance: SceneStateTransition<T> }[] = []

  constructor(
    private readonly scene: T,
    states: Extending<SceneState<T>>[],
    transitions: Extending<SceneStateTransition<T>>[]
  ) {
    if (states.length === 0) {
      console.warn(`SceneStateManager wasn't given any states\n${new Error().stack}`)
      return
    }

    const DefaultState = states.shift()
    this.defaultState = new DefaultState(scene, this)
    this.states.push({ type: DefaultState, instance: this.defaultState })

    states.forEach(State => {
      this.states.push({ type: State, instance: new State(scene, this) })
    })
    transitions.forEach(Transition => {
      this.transitions.push({ type: Transition, instance: new Transition(scene) })
    })

    scene.onCreate.add(() => this.onSceneCreated())
    scene.onShutdown.add(() => this.onSceneShutDown())
  }

  public async trigger(Transition: Extending<SceneStateTransition<T>>): Promise<void> {
    const transition = this.transitions.reduce((acc, trans) => {
      if (acc) return acc
      if (trans.type === Transition) return trans.instance
      return null
    }, null)
    if (!transition) throw `Invalid transition: ${Transition}`

    const NextStateOrTransition = await transition.enter(this.scene.isVisible)
    await this.setStateOrTransition(NextStateOrTransition)
  }

  private findState(Type: Class<any>): SceneState<T> {
    return this.states.reduce((acc, state) => acc || (state.type === Type ? state.instance : null), null)
  }

  private findTransitionType(Type: Class<any>): Extending<SceneStateTransition<T>> {
    return this.transitions.reduce((acc, trans) => acc || (trans.type === Type ? trans.type : null), null)
  }

  private async setStateOrTransition(StateOrTransition: (Extending<SceneState<T>>|Extending<SceneStateTransition<T>>)) {
    const state = this.findState(StateOrTransition)
    if (state) {
      await this._setActiveState(state)
    } else {
      const transition = await this.findTransitionType(StateOrTransition)
      await this.trigger(transition)
    }
  }

  public async setActiveState(State: Extending<SceneState<T>>): Promise<void> {
    const nextState = this.states.reduce((acc, state) =>
        acc || (state.type === State ? state.instance : null), null)
    if (!nextState) throw `Invalid state: ${State}`
    await this._setActiveState(nextState)
  }

  public getActiveState(): Extending<SceneState<T>> {
    return this.states.reduce((acc, state) => acc || state.instance === this.activeState ? state.type : null, null)
  }

  private async _setActiveState(nextState: SceneState<T>): Promise<void> {
    if (!nextState) throw 'nextState must be set'

    const sceneIsVisible = this.scene.isVisible
    if (this.activeState) {
      if (sceneIsVisible) await this.activeState.hide()
      await this.activeState.exit()
    }

    this.activeState = nextState
    await this.reenter()
  }

  private onSceneCreated() {
    console.log('on scene created')
    if (this.activeState) {
      this.activeState.show() // TODO: check if we actually need to await this
    } else {
      this._setActiveState(this.defaultState)
    }
  }

  private onSceneShutDown() {
    if (this.activeState) {
      this.activeState.hide() // TODO: check if we actually need to await this
    }
  }

  public async reenter(): Promise<void> {
    await this.activeState.enter()
    if (this.scene.isVisible) {
      await this.activeState.show()
    }
  }
}
