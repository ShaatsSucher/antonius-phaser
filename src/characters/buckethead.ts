import * as Assets from '../assets'
import Character from './character'
import CharacterState from './characterState'
import { ArrayUtils, StringUtils } from '../utils/utils'
import SpeechHelper from '../utils/speechHelper'

export default class BucketheadCharacter extends Character {
  public readonly speech = new SpeechHelper(this, 0, 0, SpeechHelper.Generators.combine({
    bucket: ArrayUtils.range(1, 29).map(i =>
      Assets.Audio[`bucketmanWithBucket${StringUtils.intToString(i, 3)}`].key
    ),
    hat: ArrayUtils.range(1, 29).map(i =>
      Assets.Audio[`bucketmanNoBucket${StringUtils.intToString(i, 3)}`].key
    )
  }))

  constructor(game: Phaser.Game, x: number, y: number) {
    super(game, x, y, Assets.Spritesheets.bucketman.key)

    this.animations.add('idleBucket', ArrayUtils.range(2, 13), 8, true)
    this.animations.add('idleHat', ArrayUtils.range(16, 27), 8, true)
    this.animations.add('talkingBucket', [0, 1], 8, true)
    this.animations.add('talkingHat', [14, 15], 8, true)

    this.addCharacterState('idleBuckert', new IdleBucketState(this))

    this.play('idleBucket')
  }
}

class IdleBucketState implements  CharacterState<BucketheadCharacter> {
  constructor(public character: BucketheadCharacter) {}

  async enter() {
    this.character.animations.stop()
    this.character.play('idleBucket')
  }
}

class TalkingBucketState implements  CharacterState<BucketheadCharacter> {
  constructor(public character: BucketheadCharacter) {}

  async enter() {
    this.character.animations.stop()
    this.character.play('TalkingBucket')
  }
}

class IdleHatState implements  CharacterState<BucketheadCharacter> {
  constructor(public character: BucketheadCharacter) {}

  async enter() {
    this.character.animations.stop()
    this.character.play('idleHat')
  }
}

class TalkingHatState implements  CharacterState<BucketheadCharacter> {
  constructor(public character: BucketheadCharacter) {}

  async enter() {
    this.character.animations.stop()
    this.character.play('talkingHat')
  }
}
