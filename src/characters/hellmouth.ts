import * as Assets from '../assets'
import Character from './character'
import CharacterState from './characterState'
import { ArrayUtils, StringUtils } from '../utils/utils'
import Scene from '../states/scenes/scene'
import SpeechHelper from '../utils/speechHelper'
import { AudioManager } from '../utils/audioManager'
import { Property } from '../utils/property'

export default class HellmouthCharacter extends Character {
  public readonly speech = new SpeechHelper(this, 0, 0, SpeechHelper.Generators.random(
    ArrayUtils.range(1, 38).map(i =>
      Assets.Audio[`hellmouth${StringUtils.intToString(i, 3)}`].key
    )
  ))

  public currentFrame = new Property<number>(0)

  constructor(scene: Scene, x: number, y: number) {
    super(scene, x, y, Assets.Spritesheets.hellmouth.key)

    // Kill me now, please
    this.animations.add('idle', [0, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 4, true)
    this.animations.add('talking', ArrayUtils.range(4, 20), 16, true)
    this.animations.add('open mouth', ArrayUtils.range(4, 13), 16, false)
    this.animations.add('close mouth', ArrayUtils.range(14, 20), 16, false)

    this.animations.add('close forehead', ArrayUtils.range(21, 79), 0, false)

    const animations = <{ [name: string]: Phaser.Animation }>this.animations['_anims']
    Object.keys(animations)
      .map(key => animations[key])
      .forEach(anim => {
        anim.enableUpdate = true
        anim.onUpdate.add((_, frame: Phaser.Frame) => this.currentFrame.value = frame.index)
        anim.onStart.add((animation: Phaser.Animation) => this.currentFrame.value = animation.frame)
      })

    this.addCharacterState('idle', new IdleState(this))
    this.addCharacterState('talking', new TalkingState(this))
    this.addCharacterState('open mouth', new OpenMouthState(this))
    this.addCharacterState('close mouth', new CloseMouthState(this))
    this.addCharacterState('close forehead', new CloseForeheadState(this))

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

class OpenMouthState implements CharacterState<HellmouthCharacter> {
  constructor(public character: HellmouthCharacter) { }

  async enter() {
    this.character.animations.stop()
    const anim = this.character.play('open mouth')
    anim.restart()
    let animDoneCb
    const animDone = new Promise(resolve => { animDoneCb = resolve })
    anim.onComplete.addOnce(animDoneCb)
    await animDone
  }
}

class CloseMouthState implements CharacterState<HellmouthCharacter> {
  constructor(public character: HellmouthCharacter) { }

  async enter() {
    this.character.animations.stop()
    const anim = this.character.play('close mouth')
    anim.restart()
    anim.onComplete.addOnce(() => {
      this.character.setActiveState('idle')
    })
  }
}

class CloseForeheadState implements CharacterState<HellmouthCharacter> {
  constructor(public character: HellmouthCharacter) { }

  async enter() {
    this.character.animations.stop()

    this.character.play('close forehead')
    const clip = AudioManager.instance.tracks.speech.addClip(Assets.Audio.hellmouthCloseForehead001.key)

    const updateListener = this.character.scene.onUpdate.add(() => {
      this.character.frame = Math.min(21 + Math.floor(75 * clip.sound.currentTime / clip.sound.durationMS), 79)
    })

    await clip.stopped

    updateListener.detach()
  }
}
