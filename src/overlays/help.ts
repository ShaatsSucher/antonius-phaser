import { Button, ButtonState } from '../gameObjects/button'
import { Atlases, CustomWebFonts, Images, Json } from '../assets'
import Slider from '../gameObjects/slider'
import GameObject from '../gameObjects/gameObject'

import Scene from '../states/scenes/scene'

export default class Help extends Phaser.Group {
  /* Singleton-related */

  private static _instance: Help = null
  public static get instance(): Help {
    if (!Help.initialized) {
      throw 'Help is not yet initialised'
    }
    return Help._instance
  }

  public static get initialized(): boolean {
    return !!Help._instance
  }

  public static init(game: Phaser.Game) {
    if (Help.initialized) {
      throw 'Help is already initialised'
    }
    Help._instance = new Help(game)
  }

  /* Actual Class */

  public onHelpClosed = new Phaser.Signal()

  private readonly background: Phaser.Sprite

  private constructor(game: Phaser.Game) {
    super(game, null, 'help', true)
    this.visible = false

    // Add semi-transparent background
    const backgroundShading = this.game.make.graphics(0, 0)
    backgroundShading.beginFill(0x000000, 0.6)
    backgroundShading.drawRect(0, 0, game.canvas.width, game.canvas.height)
    backgroundShading.endFill()
    this.add(backgroundShading)

    this.background = new Phaser.Sprite(game, this.game.width / 2, this.game.height / 2, Images.help.key)
    this.add(this.background)
    this.background.anchor.setTo(0.5, 0.5)
  }

  public show(): Promise<void> {
    this.visible = true
    return this.onHelpClosed.asPromise()
  }

  public hide() {
    this.visible = false
    this.onHelpClosed.dispatch()
  }
}
