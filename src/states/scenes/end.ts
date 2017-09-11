import Scene from './scene'

import { Images, Audio, CustomWebFonts } from '../../assets'

import Inventory from '../../overlays/inventory'
import { ArrayUtils, StringUtils, TimeUtils } from '../../utils/utils'

export default class EndScene extends Scene {
  image: Phaser.Sprite

  stateManagers = { } // We don't need states here

  public characters = { }
  public interactiveObjects = { }

  constructor(game: Phaser.Game) {
    super(game, '')
  }

  protected createGameObjects() {
    this.image = this.add.sprite(
      Math.round(this.world.width * 0.292),
      Math.round(this.world.height * 0.426),
      Images.backgroundsCraesbeeckAntonius.key
    )
    this.image.anchor.setTo(0.294, 0.489)
    this.image.scale.setTo((this.game.canvas.width - this.image.x) / (this.image.width - this.image.width * this.image.anchor.x))
    this.image.tint = 0x666666

    Inventory.instance.visible = false

    this.settingsButton.visible = false
    Inventory.instance.visible = false

    const label = this.game.add.text(
      this.game.world.centerX + 0.5,
      this.game.world.centerY,
      'Vielen Dank für\'s Spielen!',
      {
        font: `8px ${CustomWebFonts.pixelOperator8Bold.family}`,
        fill: '#fff',
        stroke: '#000',
        strokeThickness: 2
      }
    )
    label.anchor.setTo(0.5, 0.5)

    TimeUtils.wait(10).then(() => {
      this.game.camera.onFadeComplete.addOnce(() => {
        window.location.reload()
      })
      this.game.camera.fade(0x000000, 5000)
    })
  }
}
