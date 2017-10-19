import * as Assets from '../assets'
import Character from './character'
import CharacterState from './characterState'
import { ArrayUtils, StringUtils } from '../utils/utils'
import SpeechHelper from '../utils/speechHelper'

export default class BucketheadCharacter extends Character {
  public readonly speech = new SpeechHelper(this, 0, 0, SpeechHelper.Generators.combine({
    bucket: ArrayUtils.range(1, 29).map(i =>
      Assets.Audio[`bucketmanWithBucket${StringUtils.intToString(i, 3)}`].key
    ),
    hat: ArrayUtils.range(1, 29).map(i =>
      Assets.Audio[`bucketmanNoBucket${StringUtils.intToString(i, 3)}`].key
    )
  }))

  constructor(game: Phaser.Game, x: number, y: number) {
    super(game, x, y, Assets.Images.placeholder1.key)

    this.animations.add('idle', [0], 0, false)

    this.addCharacterState('idle', new IdleState(this))

    this.play('idle')
  }
}

class IdleState implements  CharacterState<BucketheadCharacter> {
  constructor(public character: BucketheadCharacter) {}

  async enter() {
    this.character.play('idle')
  }
}
