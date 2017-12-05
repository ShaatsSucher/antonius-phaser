import * as Assets from '../assets'
import Character from './character'
import CharacterState from './characterState'
import { ArrayUtils, StringUtils } from '../utils/utils'
import Scene from '../states/scenes/scene'
import SpeechHelper from '../utils/speechHelper'

export default class MusiciansCharacter extends Character {
  public readonly speech = new SpeechHelper(this, 0, 0, SpeechHelper.Generators.combine({
    default: SpeechHelper.Generators.random(
      ArrayUtils.range(1, 14).map(i =>
        Assets.Audio[`townmusicians${StringUtils.intToString(i, 3)}`].key
      )
    ),
    fighting: SpeechHelper.Generators.random(
      ArrayUtils.range(1, 1).map(i =>
        Assets.Audio[`townmusiciansCombat${StringUtils.intToString(i, 3)}`].key
      )
    ),
    distance: SpeechHelper.Generators.random(
      ArrayUtils.range(1, 14).map(i =>
        Assets.Audio[`townmusiciansDistance${StringUtils.intToString(i, 3)}`].key
      )
    ),
  }))

  constructor(scene: Scene, x: number, y: number) {
    super(scene, x, y, Assets.Spritesheets.townmusicians.key)

    this.animations.add('idle', ArrayUtils.range(0, 9), 8, true)

    this.addCharacterState('idle', new IdleState(this))
    this.addCharacterState('talking', new TalkingState(this))

    this.play('idle')
  }
}

class IdleState implements CharacterState<MusiciansCharacter> {
  constructor(public character: MusiciansCharacter) {}

  async enter() {
    this.character.play('idle')
  }
}

class TalkingState implements CharacterState<MusiciansCharacter> {
  constructor(public character: MusiciansCharacter) {}

  async enter() {
    this.character.play('idle')
  }
}
