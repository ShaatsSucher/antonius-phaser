import Scene from './scene'
import { SceneStateManager,
         SceneState,
         SceneStateTransition,
         ConditionalStateTransition,
         TransitionCondition
       } from '../../utils/stateManager'

import { Audio, Images, Spritesheets, Json } from '../../assets'
import { AudioManager } from '../../utils/audioManager'

import { ArrayUtils } from '../../utils/utils'

import AntoniusCharacter from '../../characters/antonius'
import SwanCharacter from '../../characters/swan'
import MusiciansCharacter from '../../characters/musicians'
import SnakesCharacter from '../../characters/snakes'
import EggWomanCharacter from '../../characters/eggwoman'

import { EggwomanWentOver } from './kitchen'

import Arrow from '../../gameObjects/arrow'
import GameObject from '../../gameObjects/gameObject'

import Inventory from '../../overlays/inventory'


export default class ConcertScene extends Scene {
  public characters: {
    antonius: AntoniusCharacter,
    swan: SwanCharacter,
    musicians: MusiciansCharacter,
    eggwoman: EggWomanCharacter
    // snakes: SnakesCharacter
  } = <any>{}

  public interactiveObjects = {
    toKitchenArrow: null,
    toTreeArrow: null
  }

  veggieItem: GameObject
  cloud: GameObject
  caneItem: GameObject

  stateManagers: { [name: string]: SceneStateManager<ConcertScene> } = {
    default: new SceneStateManager<ConcertScene>(this, [
      Initial
    ], [

    ]),
    Swan: new SceneStateManager<ConcertScene>(this, [
      InitialSwan,
      SwanGone
    ], [
      Stuck,
      GettingSmashed
    ]),
    musicians: new SceneStateManager<ConcertScene>(this, [
      InitialMusicans,
      MusiciansGone
    ], [

    ]),
    veggies: new SceneStateManager<ConcertScene>(this, [
      VeggiesPresent,
      VeggiesPickedUp
    ], [
      VeggiesBeingPickedUp
    ]),
    cane: new SceneStateManager<ConcertScene>(this, [
      CaneNotThere,
      CaneThere
    ], [
      CaneBeingTaken
    ]),
    eggwoman: new SceneStateManager<ConcertScene>(this, [
      InitialEggwoman,
      ReadyToFight,
      EggwomanGone
    ], [
      Fight
    ])
  }

  constructor(game: Phaser.Game) {
    super(
      game,
      Images.backgroundsBG06.key, // same as bard ???
      Audio.soundscapesScene3.key, // TODO: replace with correct soundscape
      [],
      Json.dialogsConcert.key
    )
  }

  protected registerConditionalStateTransitions(scenes: { [title: string]: Scene }) {
    this.stateManagers.eggwoman.registerConditionalTransitions(
      new ConditionalStateTransition(
        ReadyToFight,
        TransitionCondition.reachedState(scenes.kitchen.stateManagers.eggwoman, EggwomanWentOver)
      )
    )
    this.stateManagers.musicians.registerConditionalTransitions(
      new ConditionalStateTransition(
        MusiciansGone,
        TransitionCondition.reachedState(this.stateManagers.eggwoman, EggwomanGone)
      )
    )
    this.stateManagers.cane.registerConditionalTransitions(
      new ConditionalStateTransition(
        CaneThere,
        TransitionCondition.reachedState(this.stateManagers.eggwoman, EggwomanGone)
      )
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

    const eggwoman = this.characters.eggwoman = new EggWomanCharacter(this, 80, 100)
    eggwoman.scale = new Phaser.Point(3, 3)
    this.game.add.existing(eggwoman)

    const antonius = this.characters.antonius = new AntoniusCharacter(this, 80, 120)
    antonius.scale = new Phaser.Point(-3, 3)
    antonius.setActiveState('idle')
    this.game.add.existing(antonius)

    const swan = this.characters.swan = new SwanCharacter(this, 270, 70)
    swan.scale = new Phaser.Point(3, 3)
    this.game.add.existing(swan)

    const musicians = this.characters.musicians = new MusiciansCharacter(this, 110, 10)
    musicians.scale = new Phaser.Point(3, 3)
    this.game.add.existing(musicians)

    // const snakes = this.characters.snakes = new SnakesCharacter(this.game, 60, 180)
    // snakes.scale = new Phaser.Point(0.5, 0.2)
    // this.game.add.existing(snakes)

    this.veggieItem = new GameObject(this.game, 255, 135, Images.carrot.key)
    this.veggieItem.scale.setTo(2)
    this.game.add.existing(this.veggieItem)

    this.caneItem = new GameObject(this.game, 150, 120, Images.hammer.key)
    this.caneItem.scale.setTo(2)
    this.game.add.existing(this.caneItem)

    this.cloud = new GameObject(this.game, 80, 50, Spritesheets.cloudofdust.key)
    this.cloud.animations.add('fighting', ArrayUtils.range(6, 15), 8, true)
    this.cloud.animations.add('start', ArrayUtils.range(0, 5), 8, false)
    this.cloud.scale.setTo(3)
    this.cloud.setInteractionEnabled(false)
    this.cloud.visible = false
    this.game.add.existing(this.cloud)
  }
}

export class Initial extends SceneState<ConcertScene> {
  public async show() {
    const scene = this.scene
  }
}

// ---------------------------------------------------------------------------
// Musician States
// ---------------------------------------------------------------------------

class InitialSwan extends SceneState<ConcertScene> {
  public async show() {
    const swan = this.scene.characters.swan

    swan.interactionEnabled = true

    // TODO: make GettingSmashed transition trigger when you drag the hammer onto him
    this.listeners.push(swan.events.onInputUp.addOnce(
      () => this.stateManager.trigger(Stuck)
    ))
  }
}

class Stuck extends SceneStateTransition<ConcertScene> {
  public async enter() {
    const swan = this.scene.characters.swan

    swan.interactionEnabled = false
    await swan.play('pulling').onComplete.asPromise()

    return InitialSwan
  }
}

class GettingSmashed extends SceneStateTransition<ConcertScene> {
  public async enter() {
    const swan = this.scene.characters.swan

      swan.setActiveState('talking')

      await this.scene.playDialogJson('gettingSmashed')

      swan.setActiveState('walking')

      await this.scene.tweens.create(swan).to({
        x: -200, y: 0
      }, 3000).start().onComplete.asPromise()

    return SwanGone
  }
}

export class SwanGone extends SceneState<ConcertScene> {
  public async show() {
    this.scene.characters.swan.visible = false
  }
}

// ---------------------------------------------------------------------------
// Musician States
// ---------------------------------------------------------------------------

class InitialMusicans extends SceneState<ConcertScene> {
  public async show() {
    this.scene.characters.musicians.visible = true
  }
}

class MusiciansGone extends SceneState<ConcertScene> {
  public async show() {
    this.scene.characters.musicians.visible = false
  }
}

// ---------------------------------------------------------------------------
// Cane States
// ---------------------------------------------------------------------------

class CaneThere extends SceneState<ConcertScene> {
  public async show() {
    const scene = this.scene

    scene.caneItem.visible = true
    scene.caneItem.interactionEnabled = true

    this.listeners.push(scene.caneItem.events.onInputUp.addOnce(
      () => this.stateManager.trigger(CaneBeingTaken)
    ))
  }
}

class CaneBeingTaken extends SceneStateTransition<ConcertScene> {
  public async enter() {
    Inventory.instance.addItem(Images.hammer.key)
    return CaneNotThere
  }
}

export class CaneNotThere extends SceneState<ConcertScene> {
  public async show() {
    this.scene.caneItem.visible = false
  }
}

// ---------------------------------------------------------------------------
// Veggie States
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Eggwoman States
// ---------------------------------------------------------------------------

class InitialEggwoman extends SceneState<ConcertScene> {
  async show() {
    const eggwoman = this.scene.characters.eggwoman

    eggwoman.interactionEnabled = false
    eggwoman.visible = false

    this.scene.cloud.visible = false
  }
}

class ReadyToFight extends SceneState<ConcertScene> {
  async show() {
    const eggwoman = this.scene.characters.eggwoman

    eggwoman.interactionEnabled = true
    eggwoman.visible = true

    this.scene.cloud.visible = false

    this.listeners.push(eggwoman.events.onInputUp.addOnce(() => {
      this.stateManager.trigger(Fight)
    }))
  }
}

class Fight extends SceneStateTransition<ConcertScene> {
  async enter() {
    const chars = this.scene.characters
    const cloud = this.scene.cloud
    // this.scene.stateManagers.cane.setActiveState(CaneThere)
    // this.scene.stateManagers.musicians.setActiveState(MusiciansGone)


    await this.scene.playDialogJson('eggwomanIsPissed')

    cloud.visible = true
    await this.scene.cloud.play('start').onComplete.asPromise()

    chars.eggwoman.visible = false
    chars.musicians.visible = false
    this.scene.caneItem.visible = true

    this.scene.cloud.play('fighting')
    await this.scene.wait(2)

    await this.scene.tweens.create(cloud).to({
      x: -200, y: 0
    }, 3000).start().onComplete.asPromise()

    return EggwomanGone
  }
}

export class EggwomanGone extends SceneState<ConcertScene> {
  async show() {
    const eggwoman = this.scene.characters.eggwoman

    eggwoman.interactionEnabled = false
    eggwoman.visible = false

    this.scene.cloud.visible = false
  }
}
