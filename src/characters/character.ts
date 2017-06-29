import CharacterState from './characterState'

export default class Character extends Phaser.Sprite {
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

  public set interactionEnabled(value: boolean) {
    this.inputEnabled = value
    const mouseHoversChar = this.getBounds().contains(this.input.pointerX(0), this.input.pointerY(0))
    if (value) {
      this.input.useHandCursor = true
    }
    this.game.canvas.style.cursor = mouseHoversChar && this.interactionEnabled
      ? 'pointer'
      : 'default'
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
