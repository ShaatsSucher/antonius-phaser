import Character from './character'

export default CharacterState
interface CharacterState<T extends Character> {
  readonly character: T

  enter?(): Promise<void>
  exit?(): Promise<void>
}
