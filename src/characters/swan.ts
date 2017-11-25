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
  ), '#fff', false, 'idle free')

  constructor(scene: Scene, x: number, y: number) {
    super(scene, x, y, Assets.Spritesheets.stuckswan.key)

    this.animations.add('idle', [0], 0, false)
    this.animations.add('pulling', ArrayUtils.range(0, 8), 8, false)
    this.animations.add('idle free', [9], 0, false)
    this.animations.add('talking', [9, 10], 8, true)
    this.animations.add('walking', ArrayUtils.range(11, 22), 8, true)

    this.addCharacterState('idle', new IdleState(this))
    this.addCharacterState('pulling', new PullingState(this))
    this.addCharacterState('idle free', new IdleFreeState(this))
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

class IdleFreeState implements CharacterState<SwanCharacter> {
  constructor(public character: SwanCharacter) {}

  async enter() {
    this.character.animations.play('idle free')
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
