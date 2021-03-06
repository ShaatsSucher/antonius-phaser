import * as Assets from '../assets'
import Character from './character'
import CharacterState from './characterState'
import { ArrayUtils, StringUtils } from '../utils/utils'
import Scene from '../states/scenes/scene'
import SpeechHelper from '../utils/speechHelper'

export default class PainterCharacter extends Character {
  public readonly speech = new SpeechHelper(this, 0, 0, SpeechHelper.Generators.combine({
    unsatisfied: SpeechHelper.Generators.random(
      ArrayUtils.range(1, 33).map(i =>
        Assets.Audio[`painter${StringUtils.intToString(i, 3)}`].key
      )
    ),
    satisfied: SpeechHelper.Generators.random(
      ArrayUtils.range(1, 19).map(i =>
        Assets.Audio[`painterSatisfied${StringUtils.intToString(i, 3)}`].key
      )
    )
  }))

  constructor(scene: Scene, x: number, y: number) {
    super(scene, x, y, Assets.Spritesheets.painter.key)

    this.animations.add('idle', [0], 0, false)
    this.animations.add('talking', [0, 8], 8, true)
    this.animations.add('painting', ArrayUtils.range(0, 7), 8, true)
    this.animations.add('vanish', ArrayUtils.range(9, 21), 8, false)

    this.addCharacterState('idle', new IdleState(this))
    this.addCharacterState('talking', new TalkingState(this))
    this.addCharacterState('painting', new PaintingState(this))
    this.addCharacterState('vanish', new VanishState(this))

    this.play('idle')
  }
}

class IdleState implements CharacterState<PainterCharacter> {
  constructor(public character: PainterCharacter) {}

  async enter() {
    this.character.play('idle')
  }
}

class PaintingState implements CharacterState<PainterCharacter> {
  constructor(public character: PainterCharacter) {}

  async enter() {
    this.character.animations.stop()
    this.character.play('painting')
  }
}

class TalkingState implements CharacterState<PainterCharacter> {
  constructor(public character: PainterCharacter) {}

  async enter() {
    this.character.animations.stop()
    this.character.play('talking')
  }
}

class VanishState implements CharacterState<PainterCharacter> {
  constructor(public character: PainterCharacter) {}

  enter() {
    this.character.animations.stop()
    return this.character.play('vanish').onComplete.asPromise()
  }
}
