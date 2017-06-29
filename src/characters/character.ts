import CharacterState from './characterState'
import GameObject from '../gameObjects/gameObject'

export default class Character extends GameObject {
  private states: { [name: string]: CharacterState<Character> } = { }
  private _activeState: string = null

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
}
