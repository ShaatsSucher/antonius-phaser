import * as Assets from '../assets'
import Character from './character'
import CharacterState from './characterState'
import { ArrayUtils, StringUtils } from '../utils/utils'
import Scene from '../states/scenes/scene'
import SpeechHelper from '../utils/speechHelper'

export default class NailGooseCharacter extends Character {
  public readonly speech = new SpeechHelper(this, 0, 0, SpeechHelper.Generators.random(
    ArrayUtils.range(1, 32).map(i =>
      Assets.Audio[`nailchicken${StringUtils.intToString(i, 3)}`].key
    )
  ))

  constructor(scene: Scene, x: number, y: number) {
    super(scene, x, y, Assets.Spritesheets.nailgoose.key)

    this.animations.add('idle', [1], 0, false)
    this.animations.add('idle full', [19], 0, false)
    this.animations.add('talking', [0, 1], 8, true)
    this.animations.add('talking full', [19, 20], 8, true)
    this.animations.add('walking', ArrayUtils.range(13, 18), 8, true)
    this.animations.add('smelling', ArrayUtils.range(2, 12).concat([4, 3, 2, 1]), 8, false)

    this.addCharacterState('idle', new IdleState(this))
    this.addCharacterState('idle full', new IdleFullState(this))
    this.addCharacterState('talking', new TalkingState(this))
    this.addCharacterState('talking full', new TalkingFullState(this))
    this.addCharacterState('walking', new WalkingState(this))
    this.addCharacterState('smelling', new SmellingState(this))

    this.play('smelling')
  }
}

class IdleState implements CharacterState<NailGooseCharacter> {
  constructor(public character: NailGooseCharacter) { }

  async enter() {
    this.character.play('idle')
  }
}

class IdleFullState implements CharacterState<NailGooseCharacter> {
  constructor(public character: NailGooseCharacter) { }

  async enter() {
    this.character.play('idle full')
  }
}

class TalkingState implements CharacterState<NailGooseCharacter> {
  constructor(public character: NailGooseCharacter) { }

  async enter() {
    this.character.animations.stop() // reset animation if necessary
    const anim = this.character.play('talking')
  }
}

class TalkingFullState implements CharacterState<NailGooseCharacter> {
  constructor(public character: NailGooseCharacter) { }

  async enter() {
    this.character.animations.stop() // reset animation if necessary
    const anim = this.character.play('talking full')
  }
}

class WalkingState implements CharacterState<NailGooseCharacter> {
  constructor(public character: NailGooseCharacter) { }

  async enter() {
    this.character.animations.stop() // reset animation if necessary
    const anim = this.character.play('walking')
  }
}

class SmellingState implements CharacterState<NailGooseCharacter> {
  constructor(public character: NailGooseCharacter) { }

  async enter() {
    this.character.animations.stop() // reset animation if necessary
    const anim = this.character.play('smelling')
    anim.onComplete.addOnce(() => this.character.setActiveState('idle'))
    await anim.onComplete.asPromise()
  }
}
