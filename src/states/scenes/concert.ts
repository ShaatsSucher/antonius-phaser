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
import NailGooseCharacter from '../../characters/nailgoose'

import { EggwomanWentOver } from './kitchen'
import { NailgooseLeavingFish } from './fish'

import Arrow from '../../gameObjects/arrow'
import GameObject from '../../gameObjects/gameObject'

import Inventory from '../../overlays/inventory'


export default class ConcertScene extends Scene {
  public characters: {
    antonius: AntoniusCharacter,
    swan: SwanCharacter,
    musicians: MusiciansCharacter,
    eggwoman: EggWomanCharacter,
    // snakes: SnakesCharacter,
    nailgoose: NailGooseCharacter
  } = <any>{}

  public interactiveObjects = {
    toKitchenArrow: null,
    toTreeArrow: null,

    pond: null,
    dirt: null
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
    ]),
    nailgoose: new SceneStateManager<ConcertScene>(this, [
      InitialNailgoose,
      NailPlanted,
      NailgooseWillEnterScene,
      NailgooseGone
    ], [
      AntoniusInspectingDirt,
      PlantingNail,
      NailgooseEnteringScene
    ]),
    pond: new SceneStateManager<ConcertScene>(this, [
      InitialPond
    ], [
      LookingGood,
      NotSaltyEnough
    ])
  }

  constructor(game: Phaser.Game) {
    super(
      game,
      Images.backgroundsBG06.key,
      Audio.soundscapesScene10.key,
      Audio.musicBard.key,
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
    this.stateManagers.nailgoose.registerConditionalTransitions(
      new ConditionalStateTransition(
        NailgooseWillEnterScene,
        TransitionCondition.reachedState(scenes.fish.stateManagers.nailgoose, NailgooseLeavingFish)
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

    const dirt = this.interactiveObjects.dirt = new GameObject(this.game, 299, 183, Images.dirt.key)
    this.game.add.existing(dirt)

    const eggwoman = this.characters.eggwoman = new EggWomanCharacter(this, 35, 30)
    eggwoman.scale = new Phaser.Point(2, 2)
    this.game.add.existing(eggwoman)

    const antonius = this.characters.antonius = new AntoniusCharacter(this, 96, 120)
    antonius.scale = new Phaser.Point(-2, 2)
    antonius.anchor.x = 0.5
    antonius.setActiveState('idle')
    this.game.add.existing(antonius)

    this.veggieItem = new GameObject(this.game, 248, 55, Images.carrot.key)
    this.game.add.existing(this.veggieItem)

    const swan = this.characters.swan = new SwanCharacter(this, 265, 32)
    swan.scale = new Phaser.Point(2, 2)
    this.game.add.existing(swan)

    const musicians = this.characters.musicians = new MusiciansCharacter(this, 60, 29)
    musicians.scale = new Phaser.Point(2, 2)
    this.game.add.existing(musicians)

    // const snakes = this.characters.snakes = new SnakesCharacter(this.game, 60, 180)
    // snakes.scale = new Phaser.Point(0.5, 0.2)
    // this.game.add.existing(snakes)

    const nailgoose = this.characters.nailgoose = new NailGooseCharacter(this, 106, 130)
    nailgoose.anchor.x = 0.5
    nailgoose.scale.setTo(-2, 2)
    this.game.add.existing(nailgoose)

    this.caneItem = new GameObject(this.game, 80, 60, Images.hammer.key)
    this.game.add.existing(this.caneItem)

    this.cloud = new GameObject(this.game, 35, 0, Spritesheets.cloudofdust.key)
    this.cloud.animations.add('fighting', ArrayUtils.range(6, 15), 8, true)
    this.cloud.animations.add('start', ArrayUtils.range(0, 5), 8, false)
    this.cloud.scale.setTo(2)
    this.cloud.setInteractionEnabled(false)
    this.cloud.visible = false
    this.game.add.existing(this.cloud)

    const pond = this.interactiveObjects.pond = new GameObject(this.game, 120, 203, Images.pond.key)
    this.game.add.existing(pond)
  }
}

export class Initial extends SceneState<ConcertScene> {
  public async show() {
    const scene = this.scene
  }
}

// ---------------------------------------------------------------------------
// Pond States
// ---------------------------------------------------------------------------

class InitialPond extends SceneState<ConcertScene> {
  public async show() {
    const pond = this.scene.interactiveObjects.pond

    pond.visible = true
    pond.interactionEnabled = true

    this.listeners.push(pond.events.onInputUp.addOnce(
      () => this.stateManager.trigger(LookingGood)
    ))
    this.listeners.push(this.scene.addItemDropHandler(pond, async (key) => {
      if (key === Images.cupEmpty.key) this.stateManager.trigger(NotSaltyEnough)
      return false
    }))
  }
}

class LookingGood extends SceneStateTransition<ConcertScene> {
  public async enter() {
    this.scene.playDialogJson('lookingGood')

    return InitialPond
  }
}

class NotSaltyEnough extends SceneStateTransition<ConcertScene> {
  public async enter() {
    this.scene.playDialogJson('NotSaltyEnough')

    return InitialPond
  }
}

// ---------------------------------------------------------------------------
// Swan States
// ---------------------------------------------------------------------------

class InitialSwan extends SceneState<ConcertScene> {
  public async show() {
    const swan = this.scene.characters.swan

    swan.interactionEnabled = true

    this.listeners.push(this.scene.addItemDropHandler(swan, async (key) => {
      if (key !== Images.hammer.key) return false
      this.stateManager.trigger(GettingSmashed)
      Inventory.instance.takeItem(Images.hammer.key)
      return true
    }))

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

    swan.setActiveState('idle free')

    await AudioManager.instance.tracks.atmo.playClip(Audio.jarBreaks.key)

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
    await Inventory.instance.pickupItem(this.scene.caneItem, this.scene)
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

    await this.scene.playDialogJson('eggwomanIsPissed')

    cloud.visible = true

    this.scene.characters.musicians.speech.say('', 5.5)
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

// ---------------------------------------------------------------------------
// Nailgoose States
// ---------------------------------------------------------------------------

class InitialNailgoose extends SceneState<ConcertScene> {
  async show() {
    this.scene.characters.nailgoose.visible = false

    this.scene.interactiveObjects.dirt.interactionEnabled = true
    this.listeners.push(this.scene.interactiveObjects.dirt.events.onInputUp.addOnce(() => {
      this.stateManager.trigger(AntoniusInspectingDirt)
    }))

    this.listeners.push(this.scene.addItemDropHandler(this.scene.interactiveObjects.dirt, async (key) => {
      if (key !== Images.needle.key) return false
      this.stateManager.trigger(PlantingNail)
      return true
    }))
  }
}

class AntoniusInspectingDirt extends SceneStateTransition<ConcertScene> {
  async enter() {
    this.scene.characters.nailgoose.visible = false

    this.scene.interactiveObjects.dirt.interactionEnabled = false
    await this.scene.playDialogJson('antoniusInspectingDirt')

    return InitialNailgoose
  }
}

class PlantingNail extends SceneStateTransition<ConcertScene> {
  async enter() {
    this.scene.characters.nailgoose.visible = false
    this.scene.interactiveObjects.dirt.interactionEnabled = false

    Inventory.instance.takeItem(Images.needle.key)

    await this.scene.playDialogJson('antoniusPlantedTree')

    return NailPlanted
  }
}

export class NailPlanted extends SceneState<ConcertScene> {
  async show() {
    this.scene.characters.nailgoose.visible = false
    this.scene.interactiveObjects.dirt.interactionEnabled = false
  }
}

class NailgooseWillEnterScene extends SceneState<ConcertScene> {
  async show() {
  this.scene.interactiveObjects.dirt.interactionEnabled = false
    this.scene.wait(0).then(() => this.stateManager.trigger(NailgooseEnteringScene))
  }
}

class NailgooseEnteringScene extends SceneStateTransition<ConcertScene> {
  async enter() {
    this.scene.interactiveObjects.dirt.interactionEnabled = false

    const scene = this.scene
    const antonius = scene.characters.antonius
    const nailgoose = scene.characters.nailgoose

    nailgoose.visible = true

    const antoniusTargetX = antonius.position.x
    const nailgooseTargetX = nailgoose.position.x

    antonius.position.x = -Math.abs(antonius.width / 2)
    nailgoose.position.x = -Math.abs(nailgoose.width / 2)

    nailgoose.setActiveState('walking')
    antonius.setActiveState('walking')

    console.log('moving ng from', nailgoose.position.x, 'to', nailgooseTargetX)
    console.log('moving a from', antonius.position.x, 'to', antoniusTargetX)

    await Promise.all([
      scene.tweens.create(antonius.position).to({ x: antoniusTargetX }, 2000, Phaser.Easing.Linear.None, true).onComplete.asPromise(),
      scene.tweens.create(nailgoose.position).to({ x: nailgooseTargetX }, 2000, Phaser.Easing.Linear.None, true).onComplete.asPromise()
    ])

    nailgoose.setActiveState('idle')
    antonius.setActiveState('idle')

    console.dir(nailgoose)
    await scene.playDialogJson('nailgooseNotSeeingTree')

    nailgoose.setActiveState('walking')
    nailgoose.scale.x *= -1
    nailgoose.position.x = nailgooseTargetX
    await scene.tweens.create(nailgoose.position).to({ x: -Math.abs(nailgoose.width / 2)}, 2000, Phaser.Easing.Linear.None, true).onComplete.asPromise()

    return NailgooseGone
  }
}

export class NailgooseGone extends SceneState<ConcertScene> {
  async show() {
    this.scene.interactiveObjects.dirt.interactionEnabled = false
    this.scene.characters.nailgoose.visible = false
  }
}
