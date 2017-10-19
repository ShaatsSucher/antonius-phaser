import * as Assets from '../assets'
import Character from './character'
import CharacterState from './characterState'
import { ArrayUtils, StringUtils } from '../utils/utils'
import Scene from '../states/scenes/scene'
import SpeechHelper from '../utils/speechHelper'

export default class OwlCharacter extends Character {
  public readonly speech = new SpeechHelper(this, 0, 0, SpeechHelper.Generators.mute())

  constructor(scene: Scene, x: number, y: number) {
    super(scene, x, y, Assets.Spritesheets.peeingowl.key)

    this.animations.add('peeing', ArrayUtils.range(0, 7), 8, true)

    this.play('peeing')
  }
}
