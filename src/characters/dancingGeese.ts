import * as Assets from '../assets'
import Character from './character'
import CharacterState from './characterState'
import { ArrayUtils, StringUtils } from '../utils/utils'
import Scene from '../states/scenes/scene'
import SpeechHelper from '../utils/speechHelper'

export default class DancingGeeseCharacter extends Character {
  public readonly speech = new SpeechHelper(this, 0, 0, SpeechHelper.Generators.mute())

  constructor(scene: Scene, x: number, y: number) {
    super(scene, x, y, Assets.Spritesheets.dancegoose.key)

    this.animations.add('idle', ArrayUtils.range(0, 12), 8, true)

    this.addCharacterState('idle', new IdleState(this))

    this.play('idle')
  }
}

class IdleState implements CharacterState<DancingGeeseCharacter> {
  constructor(public character: DancingGeeseCharacter) {}

  async enter() {
    this.character.play('idle')
  }
}
