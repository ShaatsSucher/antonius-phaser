import * as Assets from '../assets'
import Character from './character'
import CharacterState from './characterState'
import { ArrayUtils, StringUtils } from '../utils/utils'
import Scene from '../states/scenes/scene'
import SpeechHelper from '../utils/speechHelper'

export default class TreeCharacter extends Character {
  public readonly speech: SpeechHelper = new SpeechHelper(this, 0, 0, SpeechHelper.Generators.combine({
    disgusted: SpeechHelper.Generators.random(
      ArrayUtils.range(1, 14).map(i =>
        Assets.Audio[`treeDisgusted${StringUtils.intToString(i, 3)}`].key
      )
    ),
    scared: SpeechHelper.Generators.random(
      ArrayUtils.range(1, 12).map(i =>
        Assets.Audio[`treeScared${StringUtils.intToString(i, 3)}`].key
      )
    ),
    shy: SpeechHelper.Generators.random(
      ArrayUtils.range(1, 12).map(i =>
        Assets.Audio[`treeShy${StringUtils.intToString(i, 3)}`].key
      )
    )
  }), false, 'idle', 'idle')

  constructor(scene: Scene, x: number, y: number) {
    // TODO: replace with correct spritesheet
    super(scene, x, y, Assets.Spritesheets.treelowerNew.key)

    this.animations.add('idle', [0, 1], 2, true)
    this.animations.add('opening', ArrayUtils.range(2, 10), 8, false)
    this.animations.add('idleOpen', [11, 12], 2, true)

    this.addCharacterState('idle', new IdleState(this))
    this.addCharacterState('opening', new OpeningState(this))
    this.addCharacterState('idleOpen', new IdleOpenState(this))

    this.play('idle')
  }
}

class IdleState implements CharacterState<TreeCharacter> {
  constructor(public character: TreeCharacter) {}

  async enter() {
    this.character.play('idle')
  }
}

class OpeningState implements CharacterState<TreeCharacter> {
  constructor(public character: TreeCharacter) {}

  async enter() {
    this.character.animations.stop()
    this.character.play('opening')
  }
}

class IdleOpenState implements CharacterState<TreeCharacter> {
  constructor(public character: TreeCharacter) {}

  async enter() {
    this.character.play('idleOpen')
  }
}
