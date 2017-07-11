import Scene from './scene'
import SceneState from './sceneState'

import { Images, Audio, CustomWebFonts } from '../../assets'

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

  private readonly text: [{ time: number, text: string }] = [
    { time: 2000, text: 'Mein Mund ist das Tor zur Hölle.' },
    { time: 7000, text: 'Meine Aufgabe ist es, die Menschheit\nvor den Dämonen zu schützen...' },
    { time: 16000, text: 'Doch...\nDiesmal ist etwas gewaltig schief gelaufen.' },
    { time: 24000, text: 'Da habe ich einmal versehentlich gegähnt\nund schon sind alle Dämonen ausgerissen!' },
    { time: 37000, text: 'Tu etwas, Antonius!' },
    { time: 40000, text: 'Du, als frommer Christ, wirst sicher einen Weg\nfinden, die Dämonen zurück in die Hölle zu treiben!' },
    { time: 56000, text: 'Gelingt es dir nicht, wird dir und der\ngesamten Menschheit ÜBLES widerfahren!!!' },
    { time: 73000, text: '' }
  ]

  public async enter(): Promise<void> {
    const worldRightOfPosition = this.scene.game.canvas.width - this.scene.image.x
    const imageRightOfAnchor = this.scene.image.width - this.scene.image.width * this.scene.image.anchor.x
    const initialScale = worldRightOfPosition / imageRightOfAnchor
    this.scene.image.scale.setTo(initialScale)
    this.scene.image.tint = 0xaaaaaa

    let lastLabels: Phaser.Text[] = []
    let nextLines = this.text.concat() // Copy the array
    const updateHandle = this.scene.onUpdate.add(() => {
      // Zoom in as the audio plays
      const progress = this.audio.currentTime / this.audio.durationMS
      this.scene.image.scale.setTo(initialScale + progress * (1 - initialScale))

      // Fade through dialogue
      if (nextLines.length > 0) {
        if (nextLines[0].time <= this.audio.currentTime) {
          console.log(`Killing old labels (${this.audio.currentTime})`)
          lastLabels.forEach(label => label.kill())

          const { time, text } = nextLines.shift()

          console.log('Adding new labels')
          const lines = text.split('\n').reverse()
          lastLabels = lines.map(line => {
            const label = this.scene.game.add.text(0, 0, line, {
                font: `8px ${CustomWebFonts.pixelOperator8Bold.family}`,
                fill: '#fff',
                stroke: '#000',
                strokeThickness: 2
              }
            )
            label.anchor.setTo(0.5, 1)
            return label
          })
          lastLabels.forEach((label, index) => {
            if (index === 0) {
              label.position.setTo(
                this.scene.game.world.centerX, this.scene.game.world.height - 5
              )
            } else {
              label.alignTo(lastLabels[index - 1], Phaser.TOP_CENTER)
            }
            if (label.width % 2 !== 0) {
              // The font renders badly when the label's width isn't even.
              // Moving the label 0.5px to the right seems to fix this.
              label.x = Math.floor(label.x) + 0.5
            }
            console.log(`${label.text}: ${label.x}, ${label.y} - ${label.width}, ${label.height}`)
          })
        }
      }
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
