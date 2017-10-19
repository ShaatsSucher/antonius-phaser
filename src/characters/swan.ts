import * as Assets from '../assets'
import Character from './character'
import CharacterState from './characterState'
import { ArrayUtils, StringUtils } from '../utils/utils'
import Scene from '../states/scenes/scene'
import SpeechHelper from '../utils/speechHelper'

export default class SwanCharacter extends Character {
  public readonly speech = new SpeechHelper(this, 0, 0, SpeechHelper.Generators.random(
    ArrayUtils.range(1, 19).map(i =>
      Assets.Audio[`stuckswan${StringUtils.intToString(i, 3)}`].key
    )
  ))

  constructor(scene: Scene, x: number, y: number) {
    super(scene, x, y, Assets.Spritesheets.stuckswan.key)

    // TODO: correct animations?
    this.animations.add('idle', [0], 0, false)
    this.animations.add('pulling', ArrayUtils.range(0, 8), 8, true)
    this.animations.add('talking', [9, 10], 8, true)
    this.animations.add('walking', ArrayUtils.range(11, 22), 8, true)

    this.addCharacterState('idle', new IdleState(this))
    this.addCharacterState('pulling', new PullingState(this))
    this.addCharacterState('talking', new TalkingState(this))
    this.addCharacterState('walking', new WalkingState(this))

    this.play('idle')
  }
}

class IdleState implements CharacterState<SwanCharacter> {
  constructor(public character: SwanCharacter) {}

  async enter() {
    this.character.play('idle')
  }
}

class PullingState implements CharacterState<SwanCharacter> {
  constructor(public character: SwanCharacter) {}

  async enter() {
    this.character.animations.stop()
    this.character.play('pulling')
  }
}

class TalkingState implements CharacterState<SwanCharacter> {
  constructor(public character: SwanCharacter) {}

  async enter() {
    this.character.animations.stop()
    this.character.play('talking')
  }
}

class WalkingState implements CharacterState<SwanCharacter> {
  constructor(public character: SwanCharacter) {}

  async enter() {
    this.character.animations.stop()
    this.character.play('walking')
  }
}
