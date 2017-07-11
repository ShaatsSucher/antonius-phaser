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

  private readonly inventoryItem: Phaser.Sprite
  public get item(): string {
    return <string>this.inventoryItem.key
  }
  public set item(value: string) {
    this.inventoryItem.loadTexture(value)
    this.inventoryItem.visible = !!value

    this.inventoryItem.position.setTo(
      Math.floor(this.background.width / 2),
      Math.floor(this.background.y - this.background.height / 2)
    )
    if (this.inventoryItem.width % 2 !== 0) this.inventoryItem.x += 0.5
    if (this.inventoryItem.height % 2 !== 0) this.inventoryItem.y += 0.5
  }

  private readonly background: Phaser.Sprite

  private constructor(game: Phaser.Game) {
    super(game, null, 'inventory', true)
    this.visible = false

    this.background = new Phaser.Sprite(game, 0, this.game.height, Images.uiInventoryBackground.key)
    this.add(this.background)
    this.background.anchor.setTo(0, 1)

    this.inventoryItem = new Phaser.Sprite(game, 0, 0)
    this.inventoryItem.anchor.setTo(0.5)
    this.add(this.inventoryItem)
  }
}
