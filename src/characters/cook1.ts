import * as Assets from '../assets'
import Character from './character'
import CharacterState from './characterState'
import { ArrayUtils, StringUtils } from '../utils/utils'
import SpeechHelper from '../utils/speechHelper'

export default class Cook1Character extends Character {
  public readonly speech = new SpeechHelper(this, 0, 0, SpeechHelper.Generators.random(
    ArrayUtils.range(1, 21).map(i =>
      Assets.Audio[`cook2${StringUtils.intToString(i, 3)}`].key
    )
  ))

  constructor(game: Phaser.Game, x: number, y: number) {
    super(game, x, y, Assets.Images.placeholder1.key)

    this.animations.add('idle', [0], 0, false)
  }
}
