import * as Assets from '../assets'
import Character from './character'
import CharacterState from './characterState'
import { ArrayUtils, StringUtils } from '../utils/utils'
import Scene from '../states/scenes/scene'
import SpeechHelper from '../utils/speechHelper'

export default class FishCharacter extends Character {
  public readonly speech = new SpeechHelper(this, 0, 0, SpeechHelper.Generators.random(
    ArrayUtils.range(1, 33).map(i =>
      Assets.Audio[`fishFish${StringUtils.intToString(i, 3)}`].key
    )
  ))

  constructor(scene: Scene, x: number, y: number) {
    super(scene, x, y, Assets.Spritesheets.fish.key)

    this.animations.add('idle', [0], 0, false)
    this.animations.add('talking', [0, 1], 8, true)
    this.animations.add('dying', ArrayUtils.range(3, 36), 24, false)
    this.animations.add('dead', [36], 0, false)

    this.addCharacterState('idle', new IdleState(this))
    this.addCharacterState('talking', new TalkingState(this))
    this.addCharacterState('dying', new DyingState(this))
    this.addCharacterState('dead', new DeadState(this))

    this.play('idle')
  }
}

class IdleState implements CharacterState<FishCharacter> {
  constructor(public character: FishCharacter) { }

  async enter() {
    this.character.play('idle')
  }
}

class TalkingState implements CharacterState<FishCharacter> {
  constructor(public character: FishCharacter) { }

  async enter() {
    this.character.animations.stop() // reset animation if necessary
    const anim = this.character.play('talking')
  }
}

class DyingState implements CharacterState<FishCharacter> {
  constructor(public character: FishCharacter) { }

  async enter() {
    this.character.animations.stop() // reset animation if necessary
    const anim = this.character.play('dying')
  }
}

class DeadState implements CharacterState<FishCharacter> {
  constructor(public character: FishCharacter) { }

  async enter() {
    this.character.animations.stop() // reset animation if necessary
    const anim = this.character.play('dead')
  }
}
