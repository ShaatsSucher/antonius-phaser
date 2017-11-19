import * as Assets from '../assets'
import Character from './character'
import CharacterState from './characterState'
import { ArrayUtils, StringUtils } from '../utils/utils'
import Scene from '../states/scenes/scene'
import SpeechHelper from '../utils/speechHelper'

export default class FightCloudCharacter extends Character {
  public readonly speech = new SpeechHelper(this, 0, 0, SpeechHelper.Generators.mute())

  constructor(scene: Scene, x: number, y: number) {
    super(scene, x, y, Assets.Spritesheets.cloudofdust.key, null, 'idle')

    this.animations.add('idle', ArrayUtils.range(0, 7), 8, true)

    this.addCharacterState('idle', new IdleState(this))
    this.addCharacterState('walking', new IdleState(this))

    this.play('idle')
  }
}

class IdleState implements CharacterState<FightCloudCharacter> {
  constructor(public character: FightCloudCharacter) {}

  async enter() {
    this.character.play('idle')
  }
}
