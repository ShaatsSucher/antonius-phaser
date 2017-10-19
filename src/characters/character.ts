import Scene from '../states/scenes/scene'
import CharacterState from './characterState'
import GameObject from '../gameObjects/gameObject'
import SpeechHelper from '../utils/speechHelper'

export default abstract class Character extends GameObject {
  private states: { [name: string]: CharacterState<Character> } = { }
  private _activeState: string = null
  public abstract readonly speech: SpeechHelper

  constructor(public readonly scene: Scene, x: number, y: number,
              key?: string | Phaser.RenderTexture | Phaser.BitmapData | PIXI.Texture,
              frame?: string | number,
              private defaultState: string = 'idle') {
    super(scene.game, x, y, key, frame)

    this.isPaused.onValueChanged.add(isPaused => {
      this.animations.paused = isPaused
      this.speech.isPaused.value = isPaused
    })
  }

  public addCharacterState(name: string, state: CharacterState<Character>): void {
    this.states[name] = state
  }

  public getCharacterState(name: string): CharacterState<Character> {
    return this.states[name]
  }

  public get activeState(): string {
    return this._activeState
  }

  public async setActiveState(newState: string) {
    if (!this.states[newState]) {
      console.log('Resetting state of', this)
      throw `'${newState}' is not a valid state`
    }

    if (this.activeState && this.states[this.activeState].exit) {
      await this.states[this.activeState].exit()
    }

    this._activeState = newState

    if (this.states[newState].enter) {
      await this.states[newState].enter()
    }
  }

  public async resetState() {
    this.setActiveState(this.defaultState)
  }
}
