import * as Assets from '../assets'
import { AudioManager } from '../utils/audioManager'
import Character from './character'
import CharacterState from './characterState'
import { ArrayUtils, StringUtils } from '../utils/utils'
import Scene from '../states/scenes/scene'
import SpeechHelper from '../utils/speechHelper'
import { Property } from '../utils/property'

export default class BucketheadCharacter extends Character {
  public readonly speech = new SpeechHelper(this, 0, 0,
    SpeechHelper.Generators.random(ArrayUtils.range(1, 29).map(i =>
      Assets.Audio[`bucketmanWithBucket${StringUtils.intToString(i, 3)}`].key
    )), '#fff', false, 'idleBucket', 'talkingBucket'
  )

  public readonly hatSpeech = new SpeechHelper(this, 0, 0,
    SpeechHelper.Generators.random(ArrayUtils.range(1, 29).map(i =>
      Assets.Audio[`bucketmanNoBucket${StringUtils.intToString(i, 3)}`].key
    )), '#fff', false, 'idleHat', 'talkingHat'
  )

  constructor(scene: Scene, x: number, y: number) {
    super(scene, x, y, Assets.Spritesheets.bucketman.key, null, 'idleBucket')

    this.animations.add('idleBucket', ArrayUtils.repeat(0, 20).concat(ArrayUtils.range(2, 13)), 8, true)
    this.animations.add('idleHat', ArrayUtils.repeat(0, 20).concat(ArrayUtils.range(16, 27)), 8, true)
    this.animations.add('talkingBucket', [0, 1], 8, true)
    this.animations.add('talkingHat', [14, 15], 8, true)

    const currentFrame = new Property(0)
    const animations = <{ [name: string]: Phaser.Animation }>this.animations['_anims']
    Object.keys(animations)
      .map(key => animations[key])
      .forEach(anim => {
        anim.enableUpdate = true
        anim.onUpdate.add((_, frame: Phaser.Frame) => currentFrame.value = frame.index)
        anim.onStart.add((animation: Phaser.Animation) => currentFrame.value = animation.frame)
      })
    const bucketKnockSamples: string[] = ArrayUtils.range(1, 7).map(i => Assets.Audio[`bucketmanBucketKnock${StringUtils.intToString(i, 3)}`].key)
    const hatKnockSamples: string[] = ArrayUtils.range(1, 6).map(i => Assets.Audio[`bucketmanHatKnock${StringUtils.intToString(i, 3)}`].key)
    currentFrame.onValueChanged.add(frame => {
      if (frame === 7) {
        AudioManager.instance.tracks.speech.playClip(Phaser.ArrayUtils.getRandomItem(bucketKnockSamples))
      } else if (frame === 21) {
        AudioManager.instance.tracks.speech.playClip(Phaser.ArrayUtils.getRandomItem(hatKnockSamples))
      }
    })

    this.addCharacterState('idleBucket', new IdleBucketState(this))
    this.addCharacterState('talkingBucket', new TalkingBucketState(this))
    this.addCharacterState('idleHat', new IdleHatState(this))
    this.addCharacterState('talkingHat', new IdleHatState(this))

    this.play('idleBucket')
  }
}

class IdleBucketState implements CharacterState<BucketheadCharacter> {
  constructor(public character: BucketheadCharacter) {}

  async enter() {
    this.character.animations.stop()
    this.character.play('idleBucket')
  }
}

class TalkingBucketState implements CharacterState<BucketheadCharacter> {
  constructor(public character: BucketheadCharacter) {}

  async enter() {
    this.character.animations.stop()
    this.character.play('talkingBucket')
  }
}

class IdleHatState implements CharacterState<BucketheadCharacter> {
  constructor(public character: BucketheadCharacter) {}

  async enter() {
    this.character.animations.stop()
    this.character.play('idleHat')
  }
}

class TalkingHatState implements CharacterState<BucketheadCharacter> {
  constructor(public character: BucketheadCharacter) {}

  async enter() {
    this.character.animations.stop()
    this.character.play('talkingHat')
  }
}
