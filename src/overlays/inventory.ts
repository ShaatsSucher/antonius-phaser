import { Button, ButtonState } from '../gameObjects/button'
import { Atlases, Images } from '../assets'
import Slider from '../gameObjects/slider'

export default class Inventory extends Phaser.Group {
  /* Singleton-related */

  private static _instance: Inventory = null
  public static get instance(): Inventory {
    if (!Inventory.initialized) {
      throw 'SettingsOverlay is not yet initialised'
    }
    return Inventory._instance
  }

  public static get initialized(): boolean {
    return !!Inventory._instance
  }

  public static init(game: Phaser.Game) {
    if (Inventory.initialized) {
      throw 'SettingsOverlay is already initialised'
    }
    Inventory._instance = new Inventory(game)
  }

  /* Actual Class */
  private constructor(game: Phaser.Game) {
    super(game, null, 'inventory', true)
    this.visible = false

    const background = new Phaser.Sprite(game, 0, this.game.height, Images.uiInventoryBackground.key)
    this.add(background)
    background.anchor.setTo(0, 1)
  }
}
