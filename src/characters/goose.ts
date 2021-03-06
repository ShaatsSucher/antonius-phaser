import * as Assets from '../assets'
import { AudioManager } from '../utils/audioManager'
import Character from './character'
import CharacterState from './characterState'
import { ArrayUtils, StringUtils } from '../utils/utils'
import Scene from '../states/scenes/scene'
import SpeechHelper from '../utils/speechHelper'
import { Property } from '../utils/property'

export default class GooseCharacter extends Character {
  public readonly speech = new SpeechHelper(this, 24, -35, SpeechHelper.Generators.random(
    ArrayUtils.range(1, 14).map(i =>
      Assets.Audio[`goose${StringUtils.intToString(i, 3)}`].key
    )
  ))

  constructor(scene: Scene, x: number, y: number) {
    super(scene, x, y, Assets.Spritesheets.goose.key)

    this.animations.add('idle', [0], 0, false)
    this.animations.add('talking', [0, 1], 8, true)
    this.animations.add('walking', [0].concat(ArrayUtils.range(2, 7)), 8, true)

    const currentFrame = new Property(0)
    const animations = <{ [name: string]: Phaser.Animation }>this.animations['_anims']
    Object.keys(animations)
      .map(key => animations[key])
      .forEach(anim => {
        anim.enableUpdate = true
        anim.onUpdate.add((_, frame: Phaser.Frame) => currentFrame.value = frame.index)
        anim.onStart.add((animation: Phaser.Animation) => currentFrame.value = animation.frame)
      })
    const jumpSamples: string[] = ArrayUtils.range(1, 4).map(i => Assets.Audio[`gooseJump${StringUtils.intToString(i, 3)}`].key)
    currentFrame.onValueChanged.add(frame => {
      if (frame === 5) {
        AudioManager.instance.tracks.speech.playClip(Phaser.ArrayUtils.getRandomItem(jumpSamples))
      }
    })

    this.addCharacterState('idle', new IdleState(this))
    this.addCharacterState('talking', new TalkingState(this))
    this.addCharacterState('walking', new WalkingState(this))

    this.play('idle')
  }
}

class IdleState implements CharacterState<GooseCharacter> {
  constructor(public character: GooseCharacter) { }

  async enter() {
    this.character.play('idle')
  }
}

class TalkingState implements CharacterState<GooseCharacter> {
  constructor(public character: GooseCharacter) { }

  async enter() {
    this.character.animations.stop() // reset animation if necessary
    const anim = this.character.play('talking')
  }
}

class WalkingState implements CharacterState<GooseCharacter> {
  constructor(public character: GooseCharacter) { }

  async enter() {
    const anim = this.character.play('walking')
  }
}
