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

  public onInventoryClosed = new Phaser.Signal()

  private readonly background: Phaser.Sprite

  private readonly slots: InventorySlot[]

  private constructor(game: Phaser.Game) {
    super(game, null, 'inventory', true)
    this.visible = false

    // Add semi-transparent background
    const backgroundShading = this.game.make.graphics(0, 0)
    backgroundShading.beginFill(0x000000, 0.6)
    backgroundShading.drawRect(0, 0, game.canvas.width, game.canvas.height)
    backgroundShading.endFill()
    this.add(backgroundShading)

    this.background = new Phaser.Sprite(game, this.game.width / 2, this.game.height / 2, Images.inventoryBackground.key)
    this.background.scale.setTo(3)
    this.add(this.background)
    this.background.anchor.setTo(0.5, 0.5)

    this.slots = []
    const minX = this.game.width / 3
    const width = this.game.width / 3
    const slotsX = 3
    const minY = this.game.height / 3
    const height = this.game.height / 3
    const slotsY = 3
    for (let x = 0; x < slotsX; x++) {
      for (let y = 0; y < slotsY; y++) {
        const posX = minX + width / (slotsX - 1) * x
        const posY = minY + height / (slotsY - 1) * y
        this.slots.push(new InventorySlot(this, posX, posY))
      }
    }
  }

  public show(): Promise<void> {
    this.visible = true
    return this.onInventoryClosed.asPromise()
  }

  public hide() {
    this.visible = false
    this.onInventoryClosed.dispatch()
  }

  public countItems(key: string): number {
    const slotsWithItem = this.slots.filter(slot => slot.itemKey === key)
    return slotsWithItem.length
  }

  public hasItem(key: string, amount: number = 1): boolean {
    return this.countItems(key) >= amount
  }

  public async addItem(key: string, amount: number = 1): Promise<void> {
    if (amount < 1) {
      throw new Error('Cannot add less than one item')
    }

    const emptySlots = this.slots.filter(slot => !slot.isOccupied)
    if (emptySlots.length < amount) {
      throw new Error('The inventory is full')
    }
    for (let i = 0; i < amount; i++) {
      const slotId = this.game.rnd.between(0, emptySlots.length - 1)
      const slot = emptySlots.splice(slotId, 1)[0]
      slot.itemKey = key
    }

    // TODO: add a little animation when adding the items (if the inventory is visible)
  }

  public async takeItem(key: string, amount: number = 1): Promise<void> {
    const slotsWithItem = this.slots.filter(slot => slot.itemKey === key)
    if (slotsWithItem.length < amount) {
      throw new Error('Not enough items in the inventory')
    }
    for (let i = 0; i < amount; i++) {
      const slotId = this.game.rnd.between(0, slotsWithItem.length - 1)
      slotsWithItem.splice(slotId, 1)[0].clear()
    }
  }

  public clear() {
    this.slots.forEach(slot => slot.clear())
  }
}

class InventorySlot {
  public readonly position: Phaser.Point
  public item: Phaser.Sprite

  constructor(private readonly inventory: Inventory,
              posX: number, posY: number) {
    this.position = new Phaser.Point(posX, posY)
    this.item = null
  }

  get isOccupied(): boolean {
    return this.item != null
  }

  clear() {
    if (this.isOccupied) {
      this.inventory.remove(this.item, true)
      this.item = null
    }
  }

  set itemKey(value: string) {
    if (value == null) {
      throw new Error('Item key must not be null. Use clear() to clear the slot.')
    }
    this.clear()
    this.item = new Phaser.Sprite(this.inventory.game, this.position.x, this.position.y, value)
    this.item.scale.setTo(2)
    this.item.anchor.setTo(0.5)
    this.inventory.add(this.item)
  }

  get itemKey(): string {
    return this.isOccupied ? <string>this.item.key : null
  }
}
