import Scene from '../states/scenes/scene'

import { Pausable } from './pausable'
import { Property } from './property'

type Class<T> = new (...params) => T
export type Extending<T> = new<N extends T> (...params) => N

export abstract class SceneState<T extends Scene> implements Pausable {
  public constructor(
    protected readonly scene: T,
    protected readonly stateManager: SceneStateManager<T>
  ) { }

  public readonly isPaused = new Property<boolean>(false)

  protected listeners: (Phaser.SignalBinding | (() => void))[] = []

  public async enter(): Promise<void> { }
  public async show(): Promise<void> { }

  public async exit(): Promise<void> { }
  public async hide(): Promise<void> {
    this.clearListeners()
  }

  public clearListeners() {
    this.listeners.forEach(binding => {
      if (binding instanceof Phaser.SignalBinding) {
        binding.detach()
      } else {
        binding()
      }
    })
    this.listeners = []
  }
}

export abstract class SceneStateTransition<T extends Scene> {
  public constructor(protected readonly scene: T) { }

  public abstract enter(isVisible: boolean): Promise<Extending<SceneState<T>>|Extending<SceneStateTransition<T>>>
}

export class TransitionCondition {
  private constructor(
    public readonly satisfied: Property<boolean>,
    private readonly ancestors: TransitionCondition[] = [],
    private readonly defaultValue = false
  ) { }

  public get isSatisfied(): boolean {
    return this.satisfied.value
  }

  public reset() {
    // If the condition is derived of a combination of other conditions, it
    // should be enough to reset the ancestors and not the actual condition itself.
    if (Array.isArray(this.ancestors) && this.ancestors.length > 0) {
      this.ancestors.forEach(ancestor => ancestor.reset())
    } else {
      this.satisfied.value = this.defaultValue
    }
  }

  public static reachedState<T extends Scene>(
      stateManager: SceneStateManager<T>,
      targetState: Extending<SceneState<T>>): TransitionCondition {
    let stateReached = new Property(false)

    stateManager.onActiveStateChanged
      .map(newState => stateReached.value = stateReached.value || newState instanceof targetState)
      .discardDuplicates()
      .add(value => stateReached.value = value)

    return new TransitionCondition(stateReached)
  }

  public static isState<T extends Scene>(
      stateManager: SceneStateManager<T>,
      targetState: Extending<SceneState<T>>): TransitionCondition {
    let isState = new Property(false)

    stateManager.onActiveStateChanged
      .map(state => state instanceof targetState)
      .add(value => isState.value = value)

    return new TransitionCondition(isState)
  }

  public and(other: TransitionCondition): TransitionCondition {
    let and = new Property(false)

    this.satisfied.onValueChanged
      .combineWith(other.satisfied.onValueChanged, (l, r) => l && r)
      .add(value => and.value = value)

    return new TransitionCondition(and, [this, other])
  }

  public or(other: TransitionCondition): TransitionCondition {
    let or = new Property(false)

    this.satisfied.onValueChanged
      .combineWith(other.satisfied.onValueChanged, (l, r) => l || r)
      .add(value => or.value = value)

    return new TransitionCondition(or, [this, other])
  }

  public not(): TransitionCondition {
    let not = new Property(true)

    this.satisfied.onValueChanged.add(value => not.value = !value)

    return new TransitionCondition(not, [this], true)
  }
}

export class ConditionalStateTransition<T extends Scene> {
  constructor(private readonly targetState: Extending<SceneState<T>>|Extending<SceneStateTransition<T>>,
              private readonly transitionCondition: TransitionCondition) { }

  get satisfied(): Phaser.Signal {
    return this.transitionCondition.satisfied.onValueChanged
  }

  get isSatisfied(): boolean {
    return this.transitionCondition.isSatisfied
  }

  get target(): Extending<SceneState<T>>|Extending<SceneStateTransition<T>> {
    return this.targetState
  }

  reset() {
    this.transitionCondition.reset()
  }
}

export class SceneStateManager<T extends Scene> {
  private defaultState: SceneState<T>
  private states: { type: Extending<SceneState<T>>, instance: SceneState<T> }[] = []
  private activeState: SceneState<T>

  private transitions: { type: Extending<SceneStateTransition<T>>, instance: SceneStateTransition<T> }[] = []

  private conditionalTransitions: ConditionalStateTransition<T>[] = []

  public onActiveStateChanged = new Phaser.Signal()

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

  public resetStates(): Promise<void> {
    this.conditionalTransitions.forEach(transition => transition.reset())

    this.isFirstTimeSettingState = true
    return this._setActiveState(this.defaultState)
  }

  public registerConditionalTransitions(...transitions: ConditionalStateTransition<T>[]) {
    this.conditionalTransitions = this.conditionalTransitions.concat(transitions)

    transitions.forEach(condition => {
      const validTarget = this.states.reduce((acc, state) => acc || (state.type === condition.target), false)
        || this.transitions.reduce((acc, transition) => acc || (transition.type === condition.target), false)
      if (!validTarget) {
        return console.error('Invalid conditional target: ', condition.target)
      }

      condition.satisfied
        .filter(v => v)
        .add(() => {
          this.setStateOrTransition(condition.target)
        })
    })
  }

  private async resetScene() {
    console.log('resetting scene')
    const allObjects = this.scene.allInteractiveObjects.concat(this.scene.allCharacters)

    allObjects.forEach(obj => obj.visible = true)

    // reset all characters in the scene to idle/non-interactive
    await Promise.all(this.scene.allCharacters.map(char => char.resetState()))

    // re-enter all active states in the scene except the current sm's one
    await Promise.all(Object.keys(this.scene.stateManagers)
      .map(key => this.scene.stateManagers[key])
      .filter(sm => sm !== this)
      .map(sm => sm.reenter(false)))

    // disable all interactive objects
    console.log('disabling all objects')
    allObjects
      .map(v => { console.log('disabling', v); return v})
      .forEach(obj => obj.interactionEnabled = false)
  }

  public async trigger(Transition: Extending<SceneStateTransition<T>>): Promise<void> {
    const transition = this.transitions.reduce((acc, trans) => {
      if (acc) return acc
      if (trans.type === Transition) return trans.instance
      return null
    }, null)
    if (!transition) throw `Invalid transition: ${Transition.toString()}`

    await this.resetScene()

    console.log('entering transition', transition)
    const NextStateOrTransition = await transition.enter(this.scene.isVisible)
    console.log('setting next state or transition')
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
    if (!nextState) throw `Invalid state: ${State['name']}`
    await this._setActiveState(nextState)
  }

  public getActiveState(): Extending<SceneState<T>> {
    return this.states.reduce(
      (acc, state) => acc || (state.instance === this.activeState ? state.type : null),
      null
    )
  }

  private isFirstTimeSettingState = true
  private async _setActiveState(nextState: SceneState<T>): Promise<void> {
    if (!nextState) throw 'nextState must be set'

    const sceneIsVisible = this.scene.isVisible
    if (this.activeState) {
      if (sceneIsVisible) await this.activeState.hide()
      await this.activeState.exit()
    }

    this.activeState = nextState
    await this.reenter(!this.isFirstTimeSettingState)
    this.isFirstTimeSettingState = false
    this.onActiveStateChanged.dispatch(nextState)
  }

  private onSceneCreated() {
    if (this.activeState) {
      this.activeState.show() // TODO: check if we should `await` this
    } else {
      this._setActiveState(this.defaultState)
    }
  }

  private onSceneShutDown() {
    if (this.activeState) {
      this.activeState.hide() // TODO: check if we should `await` this
    }
  }

  public async reenter(reenterAll = true): Promise<void> {
    this.activeState.clearListeners()
    await this.activeState.enter()

    if (this.scene.isVisible) {
      console.log('showing state', this.activeState, new Error().stack)
      await this.activeState.show()
    }

    if (reenterAll) {
      this.scene.allInteractiveObjects.forEach(obj => {
        try {
          obj.interactionEnabled = true
        } catch (e) {
          console.warn(e)
        }
      })
      await Promise.all(
        Object.keys(this.scene.stateManagers)
        .map(key => this.scene.stateManagers[key])
        .filter(sm => sm !== this)
        .map(sm => sm.reenter(false))
      )
    }
  }
}
