import * as Assets from '../assets'
import Character from './character'
import CharacterState from './characterState'
import { ArrayUtils, StringUtils } from '../utils/utils'
import Scene from '../states/scenes/scene'
import SpeechHelper from '../utils/speechHelper'

export default class BreedingGeeseCharacter extends Character {
  public readonly speech = new SpeechHelper(this, 0, 0, SpeechHelper.Generators.random(
    ArrayUtils.range(1, 2).map(i =>
      Assets.Audio[`breedinggoose${StringUtils.intToString(i, 3)}`].key
    )
  ))

  constructor(scene: Scene, x: number, y: number) {
    super(scene, x, y, Assets.Spritesheets.breedinggoose.key)

    this.animations.add('idle', ArrayUtils.range(2, 20).concat(ArrayUtils.repeat(2, 30)), 8, true)
    this.animations.add('talking', [0, 1], 8, true)
    this.animations.add('hatching', ArrayUtils.range(21, 45), 8, false)
    this.animations.add('hatched', ArrayUtils.range(33, 45), 8, true)

    this.addCharacterState('idle', new IdleState(this))
    this.addCharacterState('talking', new TalkingState(this))
    this.addCharacterState('hatching', new HatchingState(this))
    this.addCharacterState('hatched', new HatchedState(this))

    this.play('idle')
  }
}

class IdleState implements CharacterState<BreedingGeeseCharacter> {
  constructor(public character: BreedingGeeseCharacter) {}

  async enter() {
    this.character.play('idle')
  }
}

class TalkingState implements CharacterState<BreedingGeeseCharacter> {
  constructor(public character: BreedingGeeseCharacter) {}

  async enter() {
    this.character.play('talking')
  }
}

class HatchingState implements CharacterState<BreedingGeeseCharacter> {
  constructor(public character: BreedingGeeseCharacter) {}

  async enter() {
    await this.character.play('hatching').onComplete.asPromise()
  }
}

class HatchedState implements CharacterState<BreedingGeeseCharacter> {
  constructor(public character: BreedingGeeseCharacter) {}

  async enter() {
    this.character.play('hatched')
  }
}
