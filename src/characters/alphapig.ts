import * as Assets from '../assets'
import Character from './character'
import CharacterState from './characterState'
import { ArrayUtils, StringUtils } from '../utils/utils'
import Scene from '../states/scenes/scene'
import SpeechHelper from '../utils/speechHelper'

export default class AlphaPigCharacter extends Character {
  public readonly speech = new SpeechHelper(this, 0, 0, SpeechHelper.Generators.random(
    ArrayUtils.range(1, 21).map(i =>
      Assets.Audio[`alphapig${StringUtils.intToString(i, 3)}`].key
    )
  ))

  constructor(scene: Scene, x: number, y: number) {
    super(scene, x, y, Assets.Spritesheets.alphapig.key)

    this.animations.add('idle', [0], 0, false)
    this.animations.add('talking', [0, 1], 8, true)
    this.animations.add('walking', ArrayUtils.range(2, 5), 8, true)

    this.addCharacterState('idle', new IdleState(this))
    this.addCharacterState('talking', new TalkingState(this))
    this.addCharacterState('walking', new WalkingState(this))
  }
}

class IdleState implements CharacterState<AlphaPigCharacter> {
  constructor(public character: AlphaPigCharacter) {}

  async enter() {
    const anim = this.character.play('idle')
  }
}

class WalkingState implements CharacterState<AlphaPigCharacter> {
  constructor(public character: AlphaPigCharacter) {}

  async enter() {
    this.character.animations.stop()
    const anim = this.character.play('walking')
  }
}

class TalkingState implements CharacterState<AlphaPigCharacter> {
  constructor(public character: AlphaPigCharacter) {}

  async enter() {
    this.character.animations.stop()
    const anim = this.character.play('talking')
  }
}
