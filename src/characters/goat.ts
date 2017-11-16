import * as Assets from '../assets'
import Character from './character'
import CharacterState from './characterState'
import { ArrayUtils, StringUtils } from '../utils/utils'
import Scene from '../states/scenes/scene'
import SpeechHelper from '../utils/speechHelper'

export default class GoatCharacter extends Character {
  public readonly speech = new SpeechHelper(this, 0, 0, SpeechHelper.Generators.combine({
    human: SpeechHelper.Generators.explicit(),
    goat: SpeechHelper.Generators.random(
      [1, 2, 3].map(i => Assets.Audio[`goatBah${StringUtils.intToString(i, 3)}`].key)
    )
  }))

  constructor(scene: Scene, x: number, y: number) {
    super(scene, x, y, Assets.Spritesheets.goat.key)

    this.animations.add('idle', [0], 0, false)

    this.addCharacterState('idle', new IdleState(this))
    this.addCharacterState('talking', new IdleState(this))

    this.play('idle')
  }
}

class IdleState implements CharacterState<GoatCharacter> {
  constructor(public character: GoatCharacter) {}

  async enter() {
    this.character.play('idle')
  }
}
