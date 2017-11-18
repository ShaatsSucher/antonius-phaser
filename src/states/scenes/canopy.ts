import Scene from './scene'
import { SceneStateManager
       , SceneState
       , SceneStateTransition
       , ConditionalStateTransition
       , TransitionCondition
       } from '../../utils/stateManager'

import { Audio, Images, Json } from '../../assets'

import AntoniusCharacter from '../../characters/antonius'
import OwlCharacter from '../../characters/owl'
import UpperTreeCharacter from '../../characters/upperTree'

import { BucketheadIsStealthy } from './forehead'

import GameObject from '../../gameObjects/gameObject'
import Arrow from '../../gameObjects/arrow'

import Inventory from '../../overlays/inventory'

export default class CanopyScene extends Scene {
  public characters: {
    antonius: AntoniusCharacter,
    owl: OwlCharacter,
    tree: UpperTreeCharacter
  } = <any>{}

  public interactiveObjects = {
    toTreeArrow: null
  }

  stateManagers = {
    owl: new SceneStateManager<CanopyScene>(this, [
      OwlPeeingOnTree,
      OwlPeeingInBucket
    ], [
      AntoniusBeingDisgusted,
      BucketBeingPutUnderOwl
    ]),
    hat: new SceneStateManager<CanopyScene>(this, [
      HatPresent,
      HatPickedUp
    ], [
      HatBeingPickedUp
    ])
  }

  bucket: GameObject
  hat: GameObject

  constructor(game: Phaser.Game) {
    super(
      game,
      Images.backgroundsBG032.key,
      Audio.soundscapesScene3.key,
      [],
      Json.dialogsCanopy.key
    )
  }

  protected createGameObjects() {
    const tree = this.characters.tree = new UpperTreeCharacter(this, 110, 58)
    tree.scale.setTo(2)
    this.game.add.existing(tree)

    this.bucket = new GameObject(this.game, 290, 175, Images.bucket.key)
    // this.bucket.scale.setTo(2)
    this.game.add.existing(this.bucket)

    this.hat = new GameObject(this.game, 120, 167, Images.hat.key)
    this.hat.scale.setTo(2)
    this.game.add.existing(this.hat)

    const antonius = this.characters.antonius = new AntoniusCharacter(this, 300, 100)
    antonius.scale = new Phaser.Point(-2, 2)
    this.game.add.existing(antonius)

    const owl = this.characters.owl = new OwlCharacter(this, 290, 120)
    owl.scale.setTo(2)
    this.game.add.existing(owl)

    const toTreeArrow = this.interactiveObjects.toTreeArrow = new Arrow(this.game, 240, 200)
    toTreeArrow.rotation = Math.PI / 2
    toTreeArrow.interactionEnabled = true
    this.game.add.existing(toTreeArrow)
    toTreeArrow.events.onInputDown.addOnce(() => {
      toTreeArrow.interactionEnabled = false
      this.fadeTo('tree')
    })
  }
}

// ---------------------------------------------------------------------------
// Owl States
// ---------------------------------------------------------------------------

class OwlPeeingOnTree extends SceneState<CanopyScene> {
  public async show() {
    const scene = this.scene

    scene.bucket.visible = false

    this.scene.setAtmoClips(Audio.owlPeeOnTree.key)

    scene.characters.owl.interactionEnabled = true
    this.listeners.push(scene.characters.owl.events.onInputUp.add(
      () => this.stateManager.trigger(AntoniusBeingDisgusted)
    ))
    this.listeners.push(this.scene.addItemDropHandler(this.scene.characters.owl, async (key) => {
      if (key !== Images.bucket.key) return false
      this.stateManager.trigger(BucketBeingPutUnderOwl)
      return true
    }))
  }
}

class AntoniusBeingDisgusted extends SceneStateTransition<CanopyScene> {
  public async enter() {
    const scene = this.scene

    await scene.playDialogJson('antoniusBeingDisgusted')

    return OwlPeeingOnTree
  }
}

class BucketBeingPutUnderOwl extends SceneStateTransition<CanopyScene> {
  public async enter() {
    Inventory.instance.takeItem(Images.bucket.key)
    return OwlPeeingInBucket
  }
}

export class OwlPeeingInBucket extends SceneState<CanopyScene> {
  public async show() {
    this.scene.bucket.visible = true

    this.scene.setAtmoClips(Audio.owlPeeInBucket.key)
  }
}

// ---------------------------------------------------------------------------
// Hat States
// ---------------------------------------------------------------------------

class HatPresent extends SceneState<CanopyScene> {
  public async show() {
    const scene = this.scene

    scene.hat.interactionEnabled = true
    this.listeners.push(scene.hat.events.onInputUp.addOnce(
      () => this.stateManager.trigger(HatBeingPickedUp)
    ))
  }
}

class HatBeingPickedUp extends SceneStateTransition<CanopyScene> {
  public async enter() {
    await Inventory.instance.pickupItem(this.scene.hat, this.scene, Images.hat.key)
    return HatPickedUp
  }
}

export class HatPickedUp extends SceneState<CanopyScene> {
  public async show() {
    this.scene.hat.visible = false
  }
}
