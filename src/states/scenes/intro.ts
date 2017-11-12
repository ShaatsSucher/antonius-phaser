import Scene from './scene'
import { SceneStateManager
       , SceneState
       , SceneStateTransition
       } from '../../utils/stateManager'

import { Images, Audio, CustomWebFonts } from '../../assets'

import Inventory from '../../overlays/inventory'
import { ArrayUtils, StringUtils } from '../../utils/utils'
import { AudioManager } from '../../utils/audioManager'

export default class IntroScene extends Scene {
  public characters = { }
  public interactiveObjects = { }

  public image: Phaser.Sprite
  public label: Phaser.Text

  stateManagers: { [name: string]: SceneStateManager<IntroScene> } = {
    intro: new SceneStateManager(this, [
      AwaitingInteraction,
      IntroDone
    ], [
      PlayIntro
    ])
  }

  constructor(game: Phaser.Game) {
    super(game, '')
  }

  public readonly text: [{ time: number, text: string }] = [
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

    this.label = this.game.add.text(this.game.world.centerX + 0.5, this.game.world.centerY, 'Zum Spielen klicken', {
        font: `8px ${CustomWebFonts.pixelOperator8Bold.family}`,
        fill: '#fff',
        stroke: '#000',
        strokeThickness: 2
      }
    )
    this.label.anchor.setTo(0.5, 0.5)
  }

  public shutdown() {
    super.shutdown()

    this.settingsButton.visible = true
    this.inventoryButton.visible = true
  }
}

class AwaitingInteraction extends SceneState<IntroScene> {
  public async show() {
    this.scene.settingsButton.visible = false
    this.scene.inventoryButton.visible = false

    this.scene.image.tint = 0xaaaaaa
    this.scene.image.inputEnabled = true
    this.scene.image.input.useHandCursor = true

    const worldRightOfPosition = this.scene.game.canvas.width - this.scene.image.x
    const imageRightOfAnchor = this.scene.image.texture.width - this.scene.image.texture.width * this.scene.image.anchor.x
    const initialScale = worldRightOfPosition / imageRightOfAnchor
    this.scene.image.scale.setTo(initialScale)

    this.scene.label.visible = true
    this.listeners.push(this.scene.image.events.onInputDown.addOnce(
      () => this.scene.stateManagers.intro.trigger(PlayIntro)
    ))
  }

  public async hide() {
    await super.hide()
    this.scene.settingsButton.visible = true
    this.scene.inventoryButton.visible = true
  }
}

export class PlayIntro extends SceneStateTransition<IntroScene> {
  public async enter(visible: boolean) {
    this.scene.label.visible = false

    const clip = AudioManager.instance.tracks.speech.addClip(Audio.introIntro.key)
    clip.play()

    const worldRightOfPosition = this.scene.game.canvas.width - this.scene.image.x
    const imageRightOfAnchor = this.scene.image.texture.width - this.scene.image.texture.width * this.scene.image.anchor.x
    const initialScale = worldRightOfPosition / imageRightOfAnchor

    let blurOutStarted = false
    let lastLabels: Phaser.Text[] = []
    let nextLines = this.scene.text.concat() // Copy the array
    const updateHandle = this.scene.onUpdate.add(() => {
      // Zoom in as the audio plays
      const progress = clip.sound.currentTime / clip.sound.durationMS
      this.scene.image.scale.setTo(initialScale + progress * (1 - initialScale))

      // Display dialogue synced to the intro audio
      if (nextLines.length > 0) {
        if (nextLines[0].time <= clip.sound.currentTime) {
          lastLabels.forEach(label => label.kill())

          const { time, text } = nextLines.shift()

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
          })
        }
      } else if (!blurOutStarted) {
        const filter = this.scene.game.add.filter('Pixelate', 800, 600)
        filter['sizeX'] = 1
        filter['sizeY'] = 1
        this.scene.image.filters = [filter]

        this.scene.tweens.create(filter).to({
          sizeX: this.scene.game.height / 3,
          sizeY: this.scene.game.width / 3
        }, clip.sound.durationMS - clip.sound.currentTime + 1000).start()

        blurOutStarted = true
      }
    })

    await Promise.race([
      this.scene.image.events.onInputDown.asPromise(),
      clip.stopped
    ])

    clip.fadeTo(0, 1).then(() => clip.stop())
    updateHandle.detach()

    return IntroDone
  }
}

class IntroDone extends SceneState<IntroScene> {
  public async show() {
    this.scene.label.visible = false

    this.scene.settingsButton.visible = false
    this.scene.inventoryButton.visible = false

    this.scene.fadeTo('head')
  }

  public async hide() {
    await super.hide()
    this.scene.settingsButton.visible = true
    this.scene.inventoryButton.visible = true
  }
}
