import * as Assets from '../assets'
import Character from './character'
import CharacterState from './characterState'
import ArrayUtils from '../utils/arrayUtils'
import StringUtils from '../utils/stringUtils'
import SpeechHelper from '../utils/speechHelper'

export default class BardCharacter extends Character {
  public speech = new SpeechHelper(this, 0, 0, SpeechHelper.Generators.alternating([
    ['Do', 6], ['Re', 6], ['Mi', 6], ['Fa', 6], ['So', 5], ['La', 5], ['Ti', 6]
  ].map((syllable, max) =>
    ArrayUtils.range(1, max).map(i =>
      Assets.Audio[`AudioBard${syllable}${StringUtils.intToString(i, 3)}`].key
    )
  )))

  constructor(game: Phaser.Game, x: number, y: number) {
    super(game, x, y, Assets.Spritesheets.SpritesheetsGoose.key)

    this.animations.add('idle', [0], 0, false)
    this.animations.add('talking', [0, 1], 8, true)
    this.animations.add('walking', [0].concat(ArrayUtils.range(2, 7)), 8, true)

    this.addCharacterState('idle', new IdleState(this))
    this.addCharacterState('talking', new TalkingState(this))
    this.addCharacterState('walking', new WalkingState(this))

    this.play('idle')
  }
}

class IdleState implements CharacterState<BardCharacter> {
  constructor(public character: BardCharacter) { }

  async enter() {
    this.character.play('idle')
  }
}

class TalkingState implements CharacterState<BardCharacter> {
  constructor(public character: BardCharacter) { }

  async enter() {
    this.character.animations.stop() // reset animation if necessary
    const anim = this.character.play('talking')
  }
}

class WalkingState implements CharacterState<BardCharacter> {
  constructor(public character: BardCharacter) { }

  async enter() {
    const anim = this.character.play('walking')
  }
}
