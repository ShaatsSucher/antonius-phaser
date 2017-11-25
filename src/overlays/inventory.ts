import { Button, ButtonState } from '../gameObjects/button'
import { Atlases, Audio, CustomWebFonts, Images, Json } from '../assets'
import Slider from '../gameObjects/slider'
import GameObject from '../gameObjects/gameObject'
import { AudioManager } from '../utils/audioManager'

import Scene from '../states/scenes/scene'

export default class Inventory extends Phaser.Group {
  /* Singleton-related */

  private static _instance: Inventory = null
  public static get instance(): Inventory {
    if (!Inventory.initialized) {
      throw 'Inventory is not yet initialised'
    }
    return Inventory._instance
  }

  public static get initialized(): boolean {
    return !!Inventory._instance
  }

  public static init(game: Phaser.Game) {
    if (Inventory.initialized) {
      throw 'Inventory is already initialised'
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
    this.background.scale.setTo(4)
    this.add(this.background)
    this.background.anchor.setTo(0.5, 0.5)

    this.slots = []
    const minX = this.game.width / 4 + 12
    const width = this.game.width / 2 - 24
    const slotsX = 3
    const minY = this.game.height / 4
    const height = this.game.height / 2
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

  public async pickupItem(item: GameObject, scene: Scene = null, key: string = null): Promise<void> {
    const enableInteraction = scene.disableInteraction()

    if (!scene) {
      scene = Scene.getActiveScene(this.game)
    }

    AudioManager.instance.tracks.speech.playClip(Audio.itemPickup.key)

    // Animate the item using the scene's tween manager to the scene's inventoryButton
    const invCenterX = scene.inventoryButton.x
    const invCenterY = scene.inventoryButton.y
    await Promise.all([
      scene.tweens.create(item)
        .to({
          x: [invCenterX - item.width / item.scale.x / 2, invCenterX],
          y: [invCenterY - 100, invCenterY]
        }, 1000, Phaser.Easing.Quadratic.InOut, true)
        .interpolation(Phaser.Math.bezierInterpolation)
        .onComplete.asPromise(),
      scene.tweens.create(item.scale)
        .to({
          x: [1, 0],
          y: [1, 0],
        }, 1000, Phaser.Easing.Quadratic.InOut, true)
        .onComplete.asPromise()
    ])

    // Actually add the item to the inventory
    await this.addItem(key || <string>item.key)

    enableInteraction()
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
  private label: Phaser.Text
  private itemNames: { [name: string]: string }

  private static readonly textStyle = {
    font: `8px ${CustomWebFonts.pixelOperator8Bold.family}`,
    fill: '#fff',
    stroke: '#000',
    strokeThickness: 2
  }

  private dragHandlers: Phaser.SignalBinding[] = []

  constructor(private readonly inventory: Inventory,
              posX: number, posY: number) {
    this.position = new Phaser.Point(posX, posY)
    this.item = null
    this.label = new Phaser.Text(
      inventory.game,
      this.position.x, this.position.y + 18,
      '[No name Set]', InventorySlot.textStyle
    )
    this.label.align = 'center'
    this.label.anchor.setTo(0.5, 0)
    this.itemNames = inventory.game.cache.getJSON(Json.items.key)
  }

  get isOccupied(): boolean {
    return this.item != null
  }

  clear() {
    if (this.isOccupied) {
      this.inventory.remove(this.item, true)
      this.inventory.remove(this.label, true)
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
    this.item.inputEnabled = true
    this.item.input.useHandCursor = true
    this.item.input.enableDrag()

    let sceneItem: Phaser.Sprite = null
    let updateHandler: Phaser.SignalBinding = null

    this.dragHandlers.push(this.item.events.onDragStart.add((sprite, pointer: Phaser.Pointer) => {
      this.inventory.hide()

      const activeScene = Scene.getActiveScene(this.inventory.game)

      sceneItem = new Phaser.Sprite(this.inventory.game, this.position.x, this.position.y, value)
      sceneItem.scale.setTo(2)
      sceneItem.anchor.setTo(0.5)

      activeScene.add.existing(sceneItem)

      const deltaX = sprite.x - pointer.x
      const deltaY = sprite.y - pointer.y
      updateHandler = activeScene.onUpdate.add(() => {
        sceneItem.position.setTo(pointer.x + deltaX, pointer.y + deltaY)
      })
    }))

    this.dragHandlers.push(this.item.events.onDragStop.add((sprite, pointer) => {
      updateHandler.detach()

      const scene = Scene.getActiveScene(this.inventory.game)

      scene.itemDropped(pointer.x, pointer.y, value).then(async (success) => {
        AudioManager.instance.tracks.speech.playClip(success ? Audio.characterPlop.key : Audio.itemPickup.key)
        if (!success) {
          const invCenterX = scene.inventoryButton.x
          const invCenterY = scene.inventoryButton.y
          await Promise.all([
            scene.tweens.create(sceneItem)
              .to({
                x: [invCenterX - sceneItem.width / sceneItem.scale.x / 2, invCenterX],
                y: [invCenterY - 100, invCenterY]
              }, 1000, Phaser.Easing.Quadratic.InOut, true)
              .interpolation(Phaser.Math.bezierInterpolation)
              .onComplete.asPromise(),
            scene.tweens.create(sceneItem.scale)
              .to({
                x: [1, 0],
                y: [1, 0],
              }, 1000, Phaser.Easing.Quadratic.InOut, true)
              .onComplete.asPromise()
          ])
        }
        await sceneItem.destroy()
      })
    }))

    this.label.text = this.itemNames[this.itemKey] || `[No name for ${this.itemKey}]`
    if (this.label.width % 2 === 1) {
      this.label.x = this.position.x - 0.5
    } else {
      this.label.x = this.position.x
    }

    this.inventory.add(this.item)
    this.inventory.add(this.label)
  }

  get itemKey(): string {
    return this.isOccupied ? <string>this.item.key : null
  }
}
