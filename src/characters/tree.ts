import * as Assets from '../assets'
import Character from './character'
import CharacterState from './characterState'
import { ArrayUtils, StringUtils } from '../utils/utils'
import SpeechHelper from '../utils/speechHelper'

export default class TreeCharacter extends Character {
  public readonly speech = new SpeechHelper(this, 0, 0, SpeechHelper.Generators.random(
    ArrayUtils.range(1, 14).map(i =>
      // TODO: replace with correct sounds
      Assets.Audio[`goose${StringUtils.intToString(i, 3)}`].key
    )
  ))

  constructor(game: Phaser.Game, x: number, y: number) {
    // TODO: replace with correct spritesheet
    super(game, x, y, Assets.Images.placeholder1.key)

    this.animations.add('idle', [0], 0, false)
    // TODO: add talking animation

    this.addCharacterState('idle', new IdleState(this))
    this.addCharacterState('talking', new TalkingState(this))

    this.play('idle')
  }
}

class IdleState implements CharacterState<TreeCharacter> {
  constructor(public character: TreeCharacter) {}

  async enter() {
    this.character.play('idle')
  }
}

class TalkingState implements CharacterState<TreeCharacter> {
  constructor(public character: TreeCharacter) {}

  async enter() {
    this.character.play('talking')
  }
}
