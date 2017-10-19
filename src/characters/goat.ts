import * as Assets from '../assets'
import Character from './character'
import CharacterState from './characterState'
import { ArrayUtils, StringUtils } from '../utils/utils'
import SpeechHelper from '../utils/speechHelper'

export default class GoatCharacter extends Character {
  public readonly speech = new SpeechHelper(this, 0, 0, SpeechHelper.Generators.random(
    ArrayUtils.range(1, 6).map(i =>
      Assets.Audio[`goat${StringUtils.intToString(i, 3)}`].key
    )
  ))

  constructor(game: Phaser.Game, x: number, y: number) {
    super(game, x, y, Assets.Spritesheets.goat.key)

    this.animations.add('idle', [0], 0, false)

    this.addCharacterState('idle', new IdleState(this))

    this.play('idle')
  }
}

class IdleState implements CharacterState<GoatCharacter> {
  constructor(public character: GoatCharacter) {}

  async enter() {
    this.character.play('idle')
  }
}
