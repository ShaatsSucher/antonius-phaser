import Scene from './scene'
import { SceneStateManager, SceneState, SceneStateTransition } from '../../utils/stateManager'

import { Audio, Images, Json } from '../../assets'

import AntoniusCharacter from '../../characters/antonius'
import SwanCharacter from '../../characters/swan'
import MusiciansCharacter from '../../characters/musicians'
import SnakesCharacter from '../../characters/snakes'

import Arrow from '../../gameObjects/arrow'
import GameObject from '../../gameObjects/gameObject'

import Inventory from '../../overlays/inventory'


export default class ConcertScene extends Scene {
  public characters: {
    antonius: AntoniusCharacter,
    swan: SwanCharacter,
    musicians: MusiciansCharacter
    // snakes: SnakesCharacter
  } = <any>{}

  public interactiveObjects = {
    toKitchenArrow: null,
    toTreeArrow: null
  }

  veggieItem: GameObject

  stateManagers = {
    default: new SceneStateManager<ConcertScene>(this, [
      Initial
    ], [

    ]),
    veggies: new SceneStateManager<ConcertScene>(this, [
      VeggiesPresent,
      VeggiesPickedUp
    ], [
      VeggiesBeingPickedUp
    ])
  }

  constructor(game: Phaser.Game) {
    super(
      game,
      Images.backgroundsBackgroundBremerStadtmusikanten.key, // same as bard ???
      Audio.soundscapesScene3.key, // TODO: replace with correct soundscape
      [],
      Json.dialogsConcert.key
    )
  }

  protected createGameObjects() {
    const toKitchenArrow = this.interactiveObjects.toKitchenArrow = new Arrow(this.game, 20, 108)
    toKitchenArrow.rotation = Math.PI
    toKitchenArrow.interactionEnabled = true
    this.game.add.existing(toKitchenArrow)
    toKitchenArrow.events.onInputDown.addOnce(() => {
      toKitchenArrow.interactionEnabled = false
      this.fadeTo('kitchen')
    })

    const toTreeArrow = this.interactiveObjects.toTreeArrow = new Arrow(this.game, 192, 20)
    toTreeArrow.rotation = - Math.PI / 2
    toTreeArrow.interactionEnabled = true
    this.game.add.existing(toTreeArrow)
    toTreeArrow.events.onInputDown.addOnce(() => {
      toTreeArrow.interactionEnabled = false
      this.fadeTo('tree')
    })

    const antonius = this.characters.antonius = new AntoniusCharacter(this, 80, 120)
    antonius.scale = new Phaser.Point(-3, 3)
    antonius.setActiveState('idle')
    this.game.add.existing(antonius)

    const swan = this.characters.swan = new SwanCharacter(this, 270, 70)
    swan.scale = new Phaser.Point(3, 3)
    this.game.add.existing(swan)

    const musicians = this.characters.musicians = new MusiciansCharacter(this, 110, 30)
    musicians.scale = new Phaser.Point(3, 3)
    this.game.add.existing(musicians)

    // const snakes = this.characters.snakes = new SnakesCharacter(this.game, 60, 180)
    // snakes.scale = new Phaser.Point(0.5, 0.2)
    // this.game.add.existing(snakes)

    this.veggieItem = new GameObject(this.game, 255, 135, Images.veggies.key)
    this.veggieItem.scale.setTo(2)
    this.game.add.existing(this.veggieItem)
  }
}

export class Initial extends SceneState<ConcertScene> {
  public async show() {
    const scene = this.scene
  }
}

class VeggiesPresent extends SceneState<ConcertScene> {
  public async show() {
    const scene = this.scene

    scene.veggieItem.interactionEnabled = true
    this.listeners.push(scene.veggieItem.events.onInputUp.addOnce(
      () => this.stateManager.trigger(VeggiesBeingPickedUp)
    ))
  }
}

class VeggiesBeingPickedUp extends SceneStateTransition<ConcertScene> {
  public async enter() {
    await Inventory.instance.pickupItem(this.scene.veggieItem, this.scene)
    return VeggiesPickedUp
  }
}

export class VeggiesPickedUp extends SceneState<ConcertScene> {
  public async show() {
    this.scene.veggieItem.visible = false
  }
}
