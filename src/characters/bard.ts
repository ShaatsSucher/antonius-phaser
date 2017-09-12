import * as Assets from '../assets'
import Character from './character'
import CharacterState from './characterState'
import { ArrayUtils, StringUtils } from '../utils/utils'
import SpeechHelper from '../utils/speechHelper'

export default class BardCharacter extends Character {
  public readonly speech = new SpeechHelper(this, 0, -40, SpeechHelper.Generators.combine({
    default: SpeechHelper.Generators.alternating((<[string, number][]>[
      ['Do', 6], ['Re', 6], ['Mi', 6], ['Fa', 6], ['So', 5], ['La', 5], ['Ti', 6]
    ]).map(item =>
      ArrayUtils.range(1, item[1]).map(i =>
        Assets.Audio[`bard${item[0]}${StringUtils.intToString(i, 3)}`].key
      )
    )),
    practice: SpeechHelper.Generators.random(ArrayUtils.range(1, 3).map(i =>
      Assets.Audio[`bardPractice${StringUtils.intToString(i, 3)}`].key
    ))
  }))
  public characterHead: Phaser.Sprite

  constructor(game: Phaser.Game, x: number, y: number) {
    super(game, x, y, Assets.Spritesheets.bard.key)

    this.characterHead = new Phaser.Sprite(this.game, 0, 0, Assets.Spritesheets.bardHead.key)
    this.characterHead.position.setTo(-this.width / 2, 0)
    this.characterHead.animations.add('talking', [0, 1], 4, true)
    this.addChild(this.characterHead)
    this.characterHead.visible = false

    this.animations.add('idle', [0], 0, false)
    this.animations.add('playing', ArrayUtils.range(0, 7), 8, true)
    this.animations.add('walking', ArrayUtils.range(8, 15), 8, true)

    this.addCharacterState('idle', new IdleState(this))
    this.addCharacterState('singing', new SingingState(this))
    this.addCharacterState('talking', new TalkingState(this))
    this.addCharacterState('walking', new WalkingState(this))

    this.play('idle')
  }
}

class IdleState implements CharacterState<BardCharacter> {
  constructor(public character: BardCharacter) { }

  async enter() {
    this.character.play('idle')

    this.character.characterHead.visible = false
  }
}

class SingingState implements CharacterState<BardCharacter> {
  constructor(public character: BardCharacter) { }

  async enter() {
    this.character.animations.stop()
    this.character.play('playing')

    this.character.characterHead.animations.stop()
    this.character.characterHead.visible = true
    this.character.characterHead.play('talking')
  }
}

class TalkingState implements CharacterState<BardCharacter> {
  constructor(public character: BardCharacter) { }

  async enter() {
    this.character.animations.stop()
    this.character.play('idle')

    this.character.characterHead.animations.stop()
    this.character.characterHead.visible = true
    this.character.characterHead.play('talking')
  }
}

class WalkingState implements CharacterState<BardCharacter> {
  constructor(public character: BardCharacter) { }

  async enter() {
    this.character.animations.stop()
    this.character.play('walking')

    this.character.characterHead.visible = false
  }
}
