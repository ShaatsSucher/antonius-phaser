import * as Assets from '../assets'
import Character from './character'
import CharacterState from './characterState'
import { ArrayUtils, StringUtils } from '../utils/utils'
import Scene from '../states/scenes/scene'
import SpeechHelper from '../utils/speechHelper'

export default class Cook1Character extends Character {
  public readonly speech = new SpeechHelper(this, 0, 0, SpeechHelper.Generators.random(
    ArrayUtils.range(1, 16).map(i =>
      Assets.Audio[`cook1${StringUtils.intToString(i, 3)}`].key
    )
  ))

  constructor(scene: Scene, x: number, y: number) {
    super(scene, x, y, Assets.Spritesheets.cook1.key)

    this.animations.add('idle', [1, 2], 2, true)
    this.animations.add('talking', [0, 1], 8, true)
    this.animations.add('walking', ArrayUtils.range(9, 14), 8, true)

    this.addCharacterState('idle', new IdleState(this))
    this.addCharacterState('talking', new TalkingState(this))
    this.addCharacterState('walking', new WalkingState(this))

    this.animations.play('idle')
  }
}

class IdleState implements CharacterState<Cook1Character> {
  constructor(public character: Cook1Character) {}

  async enter() {
    this.character.animations.stop()
    this.character.play('idle')
  }
}

class TalkingState implements CharacterState<Cook1Character> {
  constructor(public character: Cook1Character) {}

  async enter() {
    this.character.animations.stop()
    this.character.play('talking')
  }
}

class WalkingState implements CharacterState<Cook1Character> {
  constructor(public character: Cook1Character) {}

  async enter() {
    this.character.animations.stop()
    this.character.play('walking')
  }
}
