import * as Assets from '../assets'
import Character from './character'
import CharacterState from './characterState'
import ArrayUtils from '../utils/arrayUtils'
import StringUtils from '../utils/stringUtils'
import SpeechHelper from '../utils/speechHelper'

export default class HellmouthCharacter extends Character {
  public speech = new SpeechHelper(this, 0, 0, SpeechHelper.Generators.random(
    ArrayUtils.range(1, 38).map(i =>
      Assets.Audio[`AudioHellmouth${StringUtils.intToString(i, 3)}`].key
    )
  ))

  constructor(game: Phaser.Game, x: number, y: number) {
    super(game, x, y, Assets.Spritesheets.SpritesheetsHellmouthTalkcycle.key)

    this.animations.add('idle', [0], 60, true)
    this.animations.add('talking', null, 16, true)

    this.addCharacterState('idle', new IdleState(this))
    this.addCharacterState('talking', new TalkingState(this))

    this.play('idle')
  }
}

class IdleState implements CharacterState<HellmouthCharacter> {
  constructor(public character: HellmouthCharacter) { }

  async enter() {
    this.character.play('idle')
  }
}

class TalkingState implements CharacterState<HellmouthCharacter> {
  constructor(public character: HellmouthCharacter) { }

  async enter() {
    this.character.animations.stop() // reset animation if necessary
    const anim = this.character.play('talking')
  }
}
