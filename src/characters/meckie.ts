import * as Assets from '../assets'
import Character from './character'
import CharacterState from './characterState'
import { ArrayUtils, StringUtils } from '../utils/utils'
import SpeechHelper from '../utils/speechHelper'

export default class MeckieCharacter extends Character {
  public speechPattern: string = 'l'
  public speech = new SpeechHelper(this, 0, 0, SpeechHelper.Generators.random(
    ArrayUtils.range(1, 14).map(i =>
      Assets.Audio[`goose${StringUtils.intToString(i, 3)}`].key
    )
  ))

  constructor(game: Phaser.Game, x: number, y: number) {
    super(game, x, y, Assets.Images.placeholder1.key)

    this.animations.add('idle', [0], 0, false)
    this.animations.add('talking', [0], 0, false)

    this.addCharacterState('idle', new IdleState(this))
    this.addCharacterState('talking', new TalkingState(this))

    this.play('idle')
  }
}

class IdleState implements CharacterState<MeckieCharacter> {
  constructor(public character: MeckieCharacter) { }

  async enter() {
    this.character.play('idle')
  }
}

class TalkingState implements CharacterState<MeckieCharacter> {
  constructor(public character: MeckieCharacter) { }

  async enter() {
    this.character.animations.stop() // reset animation if necessary
    const anim = this.character.play('talking')
  }
}
