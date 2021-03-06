import * as Assets from '../assets'
import Character from './character'
import CharacterState from './characterState'
import { ArrayUtils, StringUtils } from '../utils/utils'
import Scene from '../states/scenes/scene'
import SpeechHelper from '../utils/speechHelper'

export default class Cook2Character extends Character {
  public readonly speech = new SpeechHelper(this, 0, 0, SpeechHelper.Generators.random(
    ArrayUtils.range(1, 21).map(i =>
      Assets.Audio[`cook2${StringUtils.intToString(i, 3)}`].key
    )
  ))

  constructor(scene: Scene, x: number, y: number) {
    super(scene, x, y, Assets.Spritesheets.cook2.key)

    this.animations.add('idle', ArrayUtils.range(1, 14).concat(ArrayUtils.repeat(14, 30)), 8, true)
    this.animations.add('talking', [0, 1], 8, true)
    this.animations.add('walking', ArrayUtils.range(15, 20), 8, true)

    this.addCharacterState('idle', new IdleState(this))
    this.addCharacterState('talking', new TalkingState(this))
    this.addCharacterState('walking', new WalkingState(this))

    this.play('idle')
  }
}

class IdleState implements CharacterState<Cook2Character> {
  constructor(public character: Cook2Character) {}

  async enter() {
    this.character.animations.stop()
    this.character.play('idle')
  }
}

class TalkingState implements CharacterState<Cook2Character> {
  constructor(public character: Cook2Character) {}

  async enter() {
    this.character.animations.stop()
    this.character.play('talking')
  }
}

class WalkingState implements CharacterState<Cook2Character> {
  constructor(public character: Cook2Character) {}

  async enter() {
    this.character.animations.stop()
    this.character.play('walking')
  }
}
