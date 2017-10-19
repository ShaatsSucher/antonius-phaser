import * as Assets from '../assets'
import Character from './character'
import CharacterState from './characterState'
import { ArrayUtils, StringUtils } from '../utils/utils'
import Scene from '../states/scenes/scene'
import SpeechHelper from '../utils/speechHelper'

export default class SnakesCharacter extends Character {
  public readonly speech = new SpeechHelper(this, 0, 0, SpeechHelper.Generators.random(
    ArrayUtils.range(1, 14).map(i =>
      Assets.Audio[`goose${StringUtils.intToString(i, 3)}`].key
      // TODO: replace with correct sounds
    )
  ))

  constructor(scene: Scene, x: number, y: number) {
    super(scene, x, y, Assets.Images.placeholder2.key) // TODO: replace with correct sprietsheet

    this.animations.add('idle', [0], 0, false)

    this.addCharacterState('idle', new IdleState(this))

    this.play('idle')
  }
}

class IdleState implements CharacterState<SnakesCharacter> {
  constructor(public character: SnakesCharacter) {}

  async enter() {
    this.character.play('idle')
  }
}
