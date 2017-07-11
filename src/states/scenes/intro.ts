import Scene from './scene'
import SceneState from './sceneState'

import { Images, Audio } from '../../assets'

import { ArrayUtils, StringUtils } from '../../utils/utils'

export default class IntroScene extends Scene {
  image: Phaser.Sprite

  constructor() {
    super('', InitialState)
  }

  protected createGameObjects() {
    this.image = this.add.sprite(
      Math.round(this.world.width * 0.292),
      Math.round(this.world.height * 0.426),
      Images.backgroundsCraesbeeckAntonius.key
    )
    this.image.anchor.setTo(0.294, 0.489)
  }
}

class InitialState implements SceneState<IntroScene> {
  constructor(public readonly scene: IntroScene) { }
  public getStateName() { return 'initial' }

  private audio: Phaser.Sound

  public async enter(): Promise<void> {
    const worldRightOfPosition = this.scene.game.canvas.width - this.scene.image.x
    const imageRightOfAnchor = this.scene.image.width - this.scene.image.width * this.scene.image.anchor.x
    const initialScale = worldRightOfPosition / imageRightOfAnchor
    this.scene.image.scale.setTo(initialScale)
    this.scene.image.tint = 0xaaaaaa

    const updateHandle = this.scene.onUpdate.add(() => {
      const progress = this.audio.currentTime / this.audio.durationMS
      this.scene.image.scale.setTo(initialScale + progress * (1 - initialScale))
    })

    this.audio = this.scene.sound.play(Audio.introIntro.key)
    this.audio.onStop.addOnce(() => {
      updateHandle.detach()
      this.scene.fadeTo('head')
    })
  }

  public async exit(): Promise<void> {
    this.audio.stop()
  }
}
