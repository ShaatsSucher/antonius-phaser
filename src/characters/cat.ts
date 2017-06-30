import * as Assets from '../assets'
import Character from './character'
import CharacterState from './characterState'
import { ArrayUtils, StringUtils } from '../utils/utils'
import SpeechHelper from '../utils/speechHelper'

export default class CatCharacter extends Character {
  public speech = new SpeechHelper(this, 0, 0, SpeechHelper.Generators.sequential(
    ArrayUtils.range(1, 3).map(i =>
      Assets.Audio[`catDenial${StringUtils.intToString(i, 3)}`].key
    )
  ))

  constructor(game: Phaser.Game, x: number, y: number) {
    super(game, x, y, Assets.Spritesheets.cat.key)

    this.animations.add('idle', null, 6, true)

    this.addCharacterState('idle', new IdleState(this))
    this.addCharacterState('talking', new TalkingState(this))

    this.play('idle')
  }
}

class IdleState implements CharacterState<CatCharacter> {
  constructor(public character: CatCharacter) { }

  async enter() {
    this.character.play('idle')
    this.character.animations.currentAnim.loop = true
    this.character.animations.currentAnim.speed = 3
  }
}

class TalkingState implements CharacterState<CatCharacter> {
  constructor(public character: CatCharacter) { }

  async enter() {
    this.character.play('idle')
    this.character.animations.currentAnim.loop = true
    this.character.animations.currentAnim.speed = 6
  }
}
