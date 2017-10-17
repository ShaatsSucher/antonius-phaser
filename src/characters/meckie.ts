import * as Assets from '../assets'
import Character from './character'
import CharacterState from './characterState'
import { ArrayUtils, StringUtils } from '../utils/utils'
import Scene from '../states/scenes/scene'
import SpeechHelper from '../utils/speechHelper'

export default class MeckieCharacter extends Character {
  public readonly speech = new SpeechHelper(this, 0, 0, SpeechHelper.Generators.pattern(
    {
      l: ArrayUtils.range(1, 10).map(i =>
        Assets.Audio[`knifeguyLong${StringUtils.intToString(i, 3)}`].key
      ),
      s: ArrayUtils.range(1, 21).map(i =>
        Assets.Audio[`knifeguyShort${StringUtils.intToString(i, 3)}`].key
      ),
      i: ArrayUtils.range(1, 7).map(i =>
        Assets.Audio[`knifeguyInterested${StringUtils.intToString(i, 3)}`].key
      ),
      h: ArrayUtils.range(1, 8).map(i =>
        Assets.Audio[`knifeguyLaughing${StringUtils.intToString(i, 3)}`].key
      )
    }
  ))

  constructor(scene: Scene, x: number, y: number) {
    super(scene, x, y, Assets.Spritesheets.knifedude.key)

    this.animations.add('idle', [0], 0, false)
    this.animations.add('talking', [21, 22], 8, true)
    this.animations.add('walking', ArrayUtils.range(14, 20), 8, true)
    this.animations.add('swinging', ArrayUtils.range(0, 13), 24, true)

    this.addCharacterState('idle', new IdleState(this))
    this.addCharacterState('talking', new TalkingState(this))
    this.addCharacterState('walking', new WalkingState(this))
    this.addCharacterState('swinging', new SwingingState(this))

    this.play('idle')
  }
}

class IdleState implements CharacterState<MeckieCharacter> {
  constructor(public character: MeckieCharacter) { }

  async enter() {
    this.character.play('idle')
  }
}

class TalkingState implements CharacterState<MeckieCharacter> {
  constructor(public character: MeckieCharacter) { }

  async enter() {
    this.character.animations.stop() // reset animation if necessary
    const anim = this.character.play('talking')
  }
}

class WalkingState implements CharacterState<MeckieCharacter> {
  constructor(public character: MeckieCharacter) { }

  async enter() {
    this.character.animations.stop() // reset animation if necessary
    const anim = this.character.play('walking')
  }
}

class SwingingState implements CharacterState<MeckieCharacter> {
  constructor(public character: MeckieCharacter) { }

  async enter() {
    this.character.animations.stop() // reset animation if necessary
    const anim = this.character.play('swinging')
  }
}
