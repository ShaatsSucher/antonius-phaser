import * as Assets from '../assets'
import Character from './character'
import CharacterState from './characterState'
import { ArrayUtils, StringUtils } from '../utils/utils'
import Scene from '../states/scenes/scene'
import SpeechHelper from '../utils/speechHelper'

export default class CatCharacter extends Character {
  public readonly speech = new SpeechHelper(this, 1, 0, SpeechHelper.Generators.combine({
    default: SpeechHelper.Generators.random(
      ArrayUtils.range(1, 3).map(i =>
        Assets.Audio[`catDenial${StringUtils.intToString(i, 3)}`].key
      )
    ),
    silent: SpeechHelper.Generators.explicit()
  }
))

  constructor(scene: Scene, x: number, y: number) {
    super(scene, x, y, Assets.Spritesheets.cat.key)

    this.animations.add('idle', [3, 4, 5], 6, true)
    this.animations.add('walking', [0, 1, 2], 6, true)

    this.addCharacterState('idle', new IdleState(this))
    this.addCharacterState('talking', new TalkingState(this))
    this.addCharacterState('walking', new WalkingState(this))

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

class WalkingState implements CharacterState<CatCharacter> {
  constructor(public character: CatCharacter) { }

  async enter() {
    this.character.play('walking')
    this.character.animations.currentAnim.loop = true
    this.character.animations.currentAnim.speed = 6
  }
}
