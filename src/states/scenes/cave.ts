import Scene from './scene'
import { SceneStateManager, SceneState, SceneStateTransition } from '../../utils/stateManager'

import { Audio, Images, Json } from '../../assets'

import AntoniusCharacter from '../../characters/antonius'

import Arrow from '../../gameObjects/arrow'
import GameObject from '../../gameObjects/gameObject'

import Inventory from '../../overlays/inventory'

export default class CaveScene extends Scene {
  public characters = {
    antonius: null
  }

  public interactiveObjects = {
    toTreeArrow: null
  }

  stateManagers = {
    color: new SceneStateManager<CaveScene>(this, [
      ColorPresent,
      ColorPickedUp
    ], [
      ColorBeingPickedUp
    ])
  }

  color: GameObject

  constructor(game: Phaser.Game) {
    super(
      game,
      Images.backgroundsBG033.key,
      Audio.soundscapesScene8.key,
      Audio.musicTree.key,
      Json.dialogsCave.key
    )
  }

  protected createGameObjects() {
    const toTreeArrow = this.interactiveObjects.toTreeArrow = new Arrow(this.game, 20, 108)
    toTreeArrow.rotation = Math.PI
    toTreeArrow.interactionEnabled = true
    this.game.add.existing(toTreeArrow)
    toTreeArrow.events.onInputDown.addOnce(() => {
      toTreeArrow.interactionEnabled = false
      this.fadeTo('tree')
    })

    const antonius = this.characters.antonius = new AntoniusCharacter(this, 192, 92)
    antonius.scale = new Phaser.Point(-3, 3)
    this.game.add.existing(antonius)

    this.color = new GameObject(this.game, 206, 163, Images.colour.key)
    this.game.add.existing(this.color)

    const light = new Phaser.Sprite(this.game, 77, 68, Images.backgroundsLightCave.key)
    this.game.add.existing(light)
  }
}

class Initial extends SceneState<CaveScene> {
  public async show() {
    const scene = this.scene

  }
}

// ---------------------------------------------------------------------------
// Color States
// ---------------------------------------------------------------------------

class ColorPresent extends SceneState<CaveScene> {
  public async show() {
    const scene = this.scene

    scene.color.interactionEnabled = true
    this.listeners.push(scene.color.events.onInputUp.addOnce(
      () => this.stateManager.trigger(ColorBeingPickedUp)
    ))
  }
}

class ColorBeingPickedUp extends SceneStateTransition<CaveScene> {
  public async enter() {
    await Inventory.instance.pickupItem(this.scene.color, this.scene)
    return ColorPickedUp
  }
}

export class ColorPickedUp extends SceneState<CaveScene> {
  public async show() {
    this.scene.color.visible = false
  }
}
