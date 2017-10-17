import * as Assets from '../assets'
import Character from './character'
import CharacterState from './characterState'
import { ArrayUtils, StringUtils } from '../utils/utils'
import SpeechHelper from '../utils/speechHelper'

export default class WomanCharacter extends Character {
  public readonly speech = new SpeechHelper(this, 0, 0, SpeechHelper.Generators.combine({
    drunk: SpeechHelper.Generators.random(
      ArrayUtils.range(1, 27).map(i =>
        Assets.Audio[`womanDrunk${StringUtils.intToString(i, 3)}`].key
      )
    ),
    sober: SpeechHelper.Generators.random(
      ArrayUtils.range(1, 26).map(i =>
        Assets.Audio[`womanSober${StringUtils.intToString(i, 3)}`].key
      )
    )}
  ))

  constructor(game: Phaser.Game, x: number, y: number) {
    super(game, x, y, Assets.Images.placeholder2.key)
    // TODO: replace with correct Spritesheets

    this.animations.add('idle', [0], 0, false)

    this.addCharacterState('idle', new IdleState(this))

    this.play('idle')
  }
}

class IdleState implements CharacterState<WomanCharacter> {
  constructor(public character: WomanCharacter) {}

  async enter() {
    this.character.play('idle')
  }
}
