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
    toTreeArrow: null,
    toForeheadArrow: null
  }

  stateManagers = {
    owl: new SceneStateManager<CanopyScene>(this, [
      OwlPeeingOnTree,
      OwlWillPeeInBucket,
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
      Images.backgroundsBackgroundTree.key,
      Audio.soundscapesScene3.key,
      [],
      Json.dialogsCanopy.key
    )
  }

  protected registerConditionalStateTransitions(scenes: { [title: string]: Scene }) {
    this.stateManagers.owl.registerConditionalTransitions(
      new ConditionalStateTransition(
        OwlWillPeeInBucket,
        TransitionCondition.reachedState(scenes.forehead.stateManagers.buckethead, BucketheadIsStealthy)
      )
    )
  }

  protected createGameObjects() {
    const tree = this.characters.tree = new UpperTreeCharacter(this, 0, 54)
    tree.scale.setTo(3)
    this.game.add.existing(tree)

    this.bucket = new GameObject(this.game, 255, 180, Images.bucket.key)
    this.bucket.scale.setTo(2)
    this.game.add.existing(this.bucket)

    this.hat = new GameObject(this.game, 74, 167, Images.hat.key)
    this.hat.scale.setTo(2)
    this.game.add.existing(this.hat)

    const antonius = this.characters.antonius = new AntoniusCharacter(this, 100, 100)
    antonius.scale.setTo(3)
    this.game.add.existing(antonius)

    const owl = this.characters.owl = new OwlCharacter(this, 260, 100)
    owl.scale.setTo(3)
    this.game.add.existing(owl)

    const toTreeArrow = this.interactiveObjects.toTreeArrow = new Arrow(this.game, 240, 200)
    toTreeArrow.rotation = Math.PI / 2
    toTreeArrow.interactionEnabled = true
    this.game.add.existing(toTreeArrow)
    toTreeArrow.events.onInputDown.addOnce(() => {
      toTreeArrow.interactionEnabled = false
      this.fadeTo('tree')
    })

    const toForeheadArrow = this.interactiveObjects.toForeheadArrow = new Arrow(this.game, 20, 108)
    toForeheadArrow.rotation = Math.PI
    toForeheadArrow.interactionEnabled = true
    this.game.add.existing(toForeheadArrow)
    toForeheadArrow.events.onInputDown.addOnce(() => {
      toForeheadArrow.interactionEnabled = false
      this.fadeTo('forehead')
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
    // TODO: play peeing sound

    scene.characters.owl.interactionEnabled = true
    this.listeners.push(scene.characters.owl.events.onInputUp.add(
      () => this.stateManager.trigger(AntoniusBeingDisgusted)
    ))
  }
}

class AntoniusBeingDisgusted extends SceneStateTransition<CanopyScene> {
  public async enter() {
    const scene = this.scene

    await scene.playDialogJson('antoniusBeingDisgusted')

    return OwlPeeingOnTree
  }
}

class OwlWillPeeInBucket extends SceneState<CanopyScene> {
  public async show() {
    const scene = this.scene

    scene.bucket.visible = false

    scene.characters.owl.interactionEnabled = true
    this.listeners.push(scene.characters.owl.events.onInputUp.add(
      () => this.stateManager.trigger(BucketBeingPutUnderOwl)
    ))
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
    // TODO: play peeing in bucket sound
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
    Inventory.instance.addItem(Images.hat.key)
    return HatPickedUp
  }
}

export class HatPickedUp extends SceneState<CanopyScene> {
  public async show() {
    this.scene.hat.visible = false
  }
}
