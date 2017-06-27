import * as Assets from '../assets'
import Character from './character'
import CharacterState from './characterState'
import ArrayUtils from '../utils/arrayUtils'
import StringUtils from '../utils/stringUtils'
import SpeechHelper from '../utils/speechHelper'

export default class AntoniusCharacter extends Character {
  public speechPattern: string = 'l'
  public speech = new SpeechHelper(this, 0, 0, SpeechHelper.Generators.pattern(
    {
      l: ArrayUtils.range(1, 30).map(i =>
        Assets.Audio[`AudioAntoniusLong${StringUtils.intToString(i, 3)}`].key
      ),
      s: ArrayUtils.range(1, 100).map(i =>
        Assets.Audio[`AudioAntoniusShort${StringUtils.intToString(i, 3)}`].key
      )
    },
    () => this.speechPattern
  ))

  constructor(game: Phaser.Game, x: number, y: number) {
    super(game, x, y, Assets.Spritesheets.SpritesheetsAntonius.key)

    this.animations.add('idle', [0], 0, false)
    this.animations.add('talking', [0, 1], 8, true)
    this.animations.add('walking', ArrayUtils.range(2, 9), 8, true)

    this.addCharacterState('idle', new IdleState(this))
    this.addCharacterState('talking', new TalkingState(this))
    this.addCharacterState('walking', new WalkingState(this))

    this.play('idle')
  }
}

class IdleState implements CharacterState<AntoniusCharacter> {
  constructor(public character: AntoniusCharacter) { }

  async enter() {
    this.character.play('idle')
  }
}

class TalkingState implements CharacterState<AntoniusCharacter> {
  constructor(public character: AntoniusCharacter) { }

  async enter() {
    this.character.animations.stop() // reset animation if necessary
    const anim = this.character.play('talking')
  }
}

class WalkingState implements CharacterState<AntoniusCharacter> {
  constructor(public character: AntoniusCharacter) { }

  async enter() {
    const anim = this.character.play('walking')
  }
}
