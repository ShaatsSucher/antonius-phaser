import * as Assets from '../assets'
import Character from './character'
import CharacterState from './characterState'
import { ArrayUtils, StringUtils } from '../utils/utils'
import Scene from '../states/scenes/scene'
import SpeechHelper from '../utils/speechHelper'

export default class UpperTreeCharacter extends Character {
  public readonly speech = new SpeechHelper(this, 0, 0, SpeechHelper.Generators.random(
    ArrayUtils.range(1, 14).map(i =>
      // TODO: replace with correct sounds
      Assets.Audio[`goose${StringUtils.intToString(i, 3)}`].key
    )
  ))

  constructor(scene: Scene, x: number, y: number) {
    super(scene, x, y, Assets.Spritesheets.treeupperNew.key)

    this.animations.add('idle', [0, 1], 2, true)
    this.animations.add('opening', ArrayUtils.range(2, 10), 8, false)
    this.animations.add('idleOpen', [11, 12], 2, true)

    this.addCharacterState('idle', new IdleState(this))
    this.addCharacterState('talking', new TalkingState(this))

    this.play('idle')
  }
}

class IdleState implements CharacterState<UpperTreeCharacter> {
  constructor(public character: UpperTreeCharacter) {}

  async enter() {
    this.character.play('idle')
  }
}

class TalkingState implements CharacterState<UpperTreeCharacter> {
  constructor(public character: UpperTreeCharacter) {}

  async enter() {
    this.character.play('idle')
  }
}

class OpeningState implements CharacterState<UpperTreeCharacter> {
  constructor(public character: UpperTreeCharacter) {}

  async enter() {
    this.character.animations.stop()
    this.character.play('opening')
  }
}
