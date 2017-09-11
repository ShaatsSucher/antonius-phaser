import Scene from './scene'

import { Images, Audio, CustomWebFonts } from '../../assets'

import Inventory from '../../overlays/inventory'
import { ArrayUtils, StringUtils } from '../../utils/utils'
import { AudioManager } from '../../utils/audioManager'

export default class IntroScene extends Scene {
  public characters = { }

  image: Phaser.Sprite

  stateManagers = { } // We don't need states here

  constructor(game: Phaser.Game) {
    super(game, '')
  }

  private readonly text: [{ time: number, text: string }] = [
    { time: 2000, text: 'Mein Mund ist das Tor zur Hölle.' },
    { time: 8000, text: 'Meine Aufgabe ist es, die Menschheit\nvor den Dämonen zu schützen...' },
    { time: 19000, text: 'Doch...\nDiesmal ist etwas gewaltig schief gelaufen.' },
    { time: 29000, text: 'Da habe ich einmal versehentlich gegähnt\nund schon sind alle Dämonen ausgerissen!' },
    { time: 44000, text: 'Tu etwas, Antonius!' },
    { time: 48000, text: 'Du, als frommer Christ, wirst sicher einen Weg\nfinden, die Dämonen zurück in die Hölle zu treiben!' },
    { time: 65000, text: 'Gelingt es dir nicht, wird dir und der\ngesamten Menschheit ÜBLES widerfahren!!!' },
    { time: 80000, text: '' }
  ]

  protected createGameObjects() {
    this.image = this.add.sprite(
      Math.round(this.world.width * 0.292),
      Math.round(this.world.height * 0.426),
      Images.backgroundsCraesbeeckAntonius.key
    )
    this.image.tint = 0xaaaaaa
    this.image.inputEnabled = true
    this.image.input.useHandCursor = true
    this.image.anchor.setTo(0.294, 0.489)
    const worldRightOfPosition = this.game.canvas.width - this.image.x
    const imageRightOfAnchor = this.image.width - this.image.width * this.image.anchor.x
    const initialScale = worldRightOfPosition / imageRightOfAnchor
    this.image.scale.setTo(initialScale)

    Inventory.instance.visible = false

    this.settingsButton.visible = false
    Inventory.instance.visible = false

    const label = this.game.add.text(this.game.world.centerX + 0.5, this.game.world.centerY, 'Zum Spielen klicken', {
        font: `8px ${CustomWebFonts.pixelOperator8Bold.family}`,
        fill: '#fff',
        stroke: '#000',
        strokeThickness: 2
      }
    )
    label.anchor.setTo(0.5, 0.5)

    this.image.events.onInputUp.addOnce(() => {
      label.visible = false
      this.startIntro()
    })
  }

  private async startIntro() {
    const clip = AudioManager.instance.tracks.speech.addClip(Audio.introIntro.key)
    clip.play()

    Promise.race([
      this.image.events.onInputUp.asPromise(),
      clip.stopped
    ]).then(() => {
      clip.fadeTo(0, 1)
      updateHandle.detach()
      this.fadeTo('head')
    })

    const initialScale = this.image.scale.x
    let blurOutStarted = false
    let lastLabels: Phaser.Text[] = []
    let nextLines = this.text.concat() // Copy the array
    const updateHandle = this.onUpdate.add(() => {
      // Zoom in as the audio plays
      const progress = clip.sound.currentTime / clip.sound.durationMS
      this.image.scale.setTo(initialScale + progress * (1 - initialScale))

      // Display dialogue synced to the intro audio
      if (nextLines.length > 0) {
        if (nextLines[0].time <= clip.sound.currentTime) {
          lastLabels.forEach(label => label.kill())

          const { time, text } = nextLines.shift()

          const lines = text.split('\n').reverse()
          lastLabels = lines.map(line => {
            const label = this.game.add.text(0, 0, line, {
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
                this.game.world.centerX, this.game.world.height - 5
              )
            } else {
              label.alignTo(lastLabels[index - 1], Phaser.TOP_CENTER)
            }
            if (label.width % 2 !== 0) {
              // The font renders badly when the label's width isn't even.
              // Moving the label 0.5px to the right seems to fix this.
              label.x = Math.floor(label.x) + 0.5
            }
          })
        }
      } else if (!blurOutStarted) {
        const filter = this.game.add.filter('Pixelate', 800, 600)
        filter['sizeX'] = 1
        filter['sizeY'] = 1
        this.image.filters = [filter]

        this.tweens.create(filter).to({
          sizeX: this.game.height / 3,
          sizeY: this.game.width / 3
        }, clip.sound.durationMS - clip.sound.currentTime + 1000).start()

        blurOutStarted = true
      }
    })
  }

  public shutdown() {
    super.shutdown()

    this.settingsButton.visible = true
    Inventory.instance.visible = true
  }
}
