import * as Assets from '../assets'
import Character from './character'
import CharacterState from './characterState'
import { ArrayUtils, StringUtils } from '../utils/utils'
import Scene from '../states/scenes/scene'
import SpeechHelper from '../utils/speechHelper'

export default class EggWomanCharacter extends Character {
  public readonly speech = new SpeechHelper(this, 0, 0, SpeechHelper.Generators.random(
    ArrayUtils.range(1, 37).map(i =>
      Assets.Audio[`eggwoman${StringUtils.intToString(i, 3)}`].key
    )
  ))

  constructor(scene: Scene, x: number, y: number) {
    super(scene, x, y, Assets.Spritesheets.eggwoman.key)

    this.animations.add('idle', ArrayUtils.range(2, 12), 8, false)
    this.animations.add('talking', [0, 1], 8, true)
    this.animations.add('walking', ArrayUtils.range(17, 28), 8, true)
    this.animations.add('enter_walking', [13, 14, 15, 16], 8, false)
    this.animations.add('exit_walking', [16, 15, 14, 13], 8, false)

    this.addCharacterState('idle', new IdleState(this))
  }
}

class IdleState implements CharacterState<EggWomanCharacter> {
  constructor(public character: EggWomanCharacter) {}

  async enter() {
    this.character.play('idle')
  }
}

class TalkingState implements CharacterState<EggWomanCharacter> {
  constructor(public character: EggWomanCharacter) {}

  async enter() {
    this.character.animations.stop()
    this.character.play('talking')
  }
}

class WalkingState implements CharacterState<EggWomanCharacter> {
  constructor(public character: EggWomanCharacter) {}

  async enter() {
    this.character.animations.stop()
    this.character.play('walking')
  }
}

class EnterWalkingState implements CharacterState<EggWomanCharacter> {
  constructor(public character: EggWomanCharacter) {}

  async enter() {
    this.character.animations.stop()
    this.character.play('enter_walking')
  }
}

class ExitWalkingState implements CharacterState<EggWomanCharacter> {
  constructor(public character: EggWomanCharacter) {}

  async enter() {
    this.character.animations.stop()
    this.character.play('exit_walking')
  }
}
