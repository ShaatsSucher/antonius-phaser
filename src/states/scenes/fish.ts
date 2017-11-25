import Scene from './scene'
import { SceneStateManager
       , SceneState
       , SceneStateTransition
       , ConditionalStateTransition
       , TransitionCondition
       } from '../../utils/stateManager'
import { Silent } from './head'

import { Audio, Images, Json, Spritesheets } from '../../assets'

import AntoniusCharacter from '../../characters/antonius'
import FishCharacter from '../../characters/fish'
import AlphaPigCharacter from '../../characters/alphapig'
import NailGooseCharacter from '../../characters/nailgoose'

import { WaitingForFishOrVeggies, CatInTheWay } from './bard'
import { NailgooseGone, NailPlanted } from './concert'

import Arrow from '../../gameObjects/arrow'
import GameObject from '../../gameObjects/gameObject'

import Inventory from '../../overlays/inventory'
import { ArrayUtils, StringUtils } from '../../utils/utils'
import { AudioManager } from '../../utils/audioManager'

export default class FishScene extends Scene {
  public characters: {
    antonius: AntoniusCharacter,
    fish: FishCharacter,
    alphapig: AlphaPigCharacter,
    nailgoose: NailGooseCharacter
  } = <any>{}

  interactiveObjects = {
    toHeadArrow: null,
    toKitchenArrow: null,
    rudder: null
  }

  readonly stateManagers: {
    [name: string]: SceneStateManager<FishScene>
  } = {
    rudder: new SceneStateManager<FishScene>(this, [
      RudderInacsessible,
      RudderGone,
      RudderThere
    ], [
      TakingRudder
    ]),
    fish: new SceneStateManager<FishScene>(this, [
      InitialFish,
      FishAlive,
      FishDying,
      FishDead,
      FishGone
    ], [
      FishConversation,
      ImFine,
      Suffocation,
      CollectFish
    ]),
    alphapig: new SceneStateManager<FishScene>(this, [
      InitialAlphaPig,
      AlphaPigGone
    ], [
      NotWithoutMyRudders,
      AlphaPigJourney
    ]),
    nailgoose: new SceneStateManager<FishScene>(this, [
      InitialNailgoose,
      NailgooseWaiting,
      NailtreePlanted,
      NailgooseLeavingFish,
      NailgooseLeftFish
    ], [
      NailgooseIntro,
      NailgooseStillWaiting,
      NailgooseLeavingTowardsConcert
    ])
  }

  constructor(game: Phaser.Game) {
    super(
      game,
      Spritesheets.backgroundsBG04.key,
      Audio.soundscapesScene9.key,
      Audio.musicHead.key,
      Json.dialogsFish.key
    )
  }

  public create() {
    super.create()
    this.backgroundImage.animations.add('default', [0, 1], 0.5, true)
    this.backgroundImage.animations.play('default')
  }

  protected registerConditionalStateTransitions(scenes: { [title: string]: Scene }) {
    this.stateManagers.fish.registerConditionalTransitions(
      new ConditionalStateTransition(
        FishDying,
        TransitionCondition.isState(this.stateManagers.fish, FishAlive)
        .and(TransitionCondition.reachedState(scenes.bard.stateManagers.meckie, WaitingForFishOrVeggies))
        .and(TransitionCondition.reachedState(scenes.bard.stateManagers.bard, CatInTheWay))
      )
    )
    this.stateManagers.rudder.registerConditionalTransitions(
      new ConditionalStateTransition(
        RudderThere,
        TransitionCondition.reachedState(this.stateManagers.fish, FishGone)
      )
    )
    this.stateManagers.nailgoose.registerConditionalTransitions(
      new ConditionalStateTransition(
        NailtreePlanted,
        TransitionCondition.reachedState(scenes.concert.stateManagers.nailgoose, NailPlanted)
      ),
      new ConditionalStateTransition(
        NailgooseLeftFish,
        TransitionCondition.reachedState(scenes.concert.stateManagers.nailgoose, NailgooseGone)
      )
    )
  }

  protected createGameObjects() {
    // Add navigation arrows
    const toHeadArrow = this.interactiveObjects.toHeadArrow = new Arrow(this.game, 190, 20)
    toHeadArrow.rotation = - Math.PI / 2
    toHeadArrow.interactionEnabled = true
    this.game.add.existing(toHeadArrow)
    toHeadArrow.events.onInputDown.addOnce(() => {
      toHeadArrow.interactionEnabled = false
      this.fadeTo('head')
    })

    const toKitchenArrow = this.interactiveObjects.toKitchenArrow = new Arrow(this.game, 364, 108)
    toKitchenArrow.interactionEnabled = true
    this.game.add.existing(toKitchenArrow)
    toKitchenArrow.events.onInputDown.addOnce(() => {
      toKitchenArrow.interactionEnabled = false
      this.fadeTo('kitchen')
    })

    const rudder = this.interactiveObjects.rudder = new GameObject(this.game, 125, 150, Images.rudder.key)
    rudder.visible = false
    this.game.add.existing(rudder)

    const goose = this.characters.nailgoose = new NailGooseCharacter(this, 95, 5)
    goose.scale.setTo(2)
    goose.anchor.x = 0.5
    this.game.add.existing(goose)

    // Add antonius
    const antonius = this.characters.antonius = new AntoniusCharacter(this, 310, 90)
    antonius.scale.setTo(2)
    antonius.anchor.x = 0.5
    antonius.setActiveState('idle')
    this.game.add.existing(antonius)

    const fish = this.characters.fish = new FishCharacter(this, 130, 107)
    // fish.scale = new Phaser.Point(3, 3)
    this.game.add.existing(fish)

    const pig = this.characters.alphapig = new AlphaPigCharacter(this, 70, 125)
    pig.scale.setTo(2)
    this.game.add.existing(pig)
  }
}

// ---------------------------------------------------------------------------
// Rudder States
// ---------------------------------------------------------------------------

class RudderInacsessible extends SceneState<FishScene> {
  public async show() {
    const rudder = this.scene.interactiveObjects.rudder

    rudder.interactionEnabled = false
    rudder.visible = true
  }
}

class RudderGone extends SceneState<FishScene> {
  public async show() {
    const rudder = this.scene.interactiveObjects.rudder

    rudder.interactionEnabled = false
    rudder.visible = true
  }
}

class RudderThere extends SceneState<FishScene> {
  public async show() {
    const rudder = this.scene.interactiveObjects.rudder

    rudder.interactionEnabled = true
    rudder.visible = true

    this.listeners.push(rudder.events.onInputUp.addOnce(
      () => this.stateManager.trigger(TakingRudder)
    ))
  }
}

class TakingRudder extends SceneStateTransition<FishScene> {
  public async enter() {
    const rudder = this.scene.interactiveObjects.rudder

    Inventory.instance.pickupItem(rudder, this.scene, Images.rudderIcon.key)

    return RudderGone
  }
}

// ---------------------------------------------------------------------------
// Fish States
// ---------------------------------------------------------------------------

export class InitialFish extends SceneState<FishScene> {
  public async show() {
    const scene = this.scene

    scene.characters.fish.interactionEnabled = true

    this.listeners.push(scene.characters.fish.events.onInputUp.addOnce(
      () => this.stateManager.trigger(FishConversation))
    )
  }
}

class FishConversation extends SceneStateTransition<FishScene> {
  public async enter() {
    const scene = this.scene

    await scene.playDialogJson('fishIntro')

    return ImFine
  }
}

class ImFine extends SceneStateTransition<FishScene> {
  public async enter() {
    const scene = this.scene

    await scene.playDialogJson('fishIsFine')

    return FishAlive
  }
}

export class FishAlive extends SceneState<FishScene> {
  public async show() {
    const scene = this.scene

    scene.characters.fish.interactionEnabled = true

    this.listeners.push(scene.characters.fish.events.onInputUp.addOnce(
      () => this.stateManager.trigger(ImFine))
    )
  }
}

export class FishDying extends SceneState<FishScene> {
  public async show() {
    const scene = this.scene

    scene.characters.fish.interactionEnabled = true

    this.listeners.push(scene.characters.fish.events.onInputDown.addOnce(
      () => this.stateManager.trigger(Suffocation)
    ))
  }
}

class Suffocation extends SceneStateTransition<FishScene> {
  public async enter() {
    const scene = this.scene

    await scene.playDialogJson('fishSuffocates')

    await scene.characters.fish.setActiveState('dying')
    await AudioManager.instance.tracks.speech.playClip(Audio.fishFishDiesFishDies.key)

    await scene.playDialogJson('fishSuffocated')

    return FishDead
  }
}

export class FishDead extends SceneState<FishScene> {
  public async show() {
    const scene = this.scene

    await scene.characters.fish.setActiveState('dead')

    scene.characters.fish.interactionEnabled = true

    this.listeners.push(scene.characters.fish.events.onInputDown.addOnce(
      () => this.stateManager.trigger(CollectFish)
    ))
  }
}

class CollectFish extends SceneStateTransition<FishScene> {
  public async enter() {
    const scene = this.scene

    await Inventory.instance.pickupItem(scene.characters.fish, scene, Images.fish.key)

    return FishGone
  }
}

export class FishGone extends SceneState<FishScene> {
  public async show() {
    const scene = this.scene

    scene.characters.fish.visible = false
  }
}

// ---------------------------------------------------------------------------
// Alpha pig States
// ---------------------------------------------------------------------------

export class InitialAlphaPig extends SceneState<FishScene> {
  public async show() {
    const alphapig = this.scene.characters.alphapig

    alphapig.interactionEnabled = true

    this.listeners.push(alphapig.events.onInputDown.addOnce(
      () => this.stateManager.trigger(NotWithoutMyRudders)
    ))
    this.listeners.push(this.scene.addItemDropHandler(alphapig, async (key) => {
      if (key !== Images.rudderIcon.key) return false
      this.stateManager.trigger(AlphaPigJourney)
      return true
    }))
  }
}

class NotWithoutMyRudders extends SceneStateTransition<FishScene> {
  public async enter() {
    const scene = this.scene

    await scene.playDialogJson('pigWontGo')

    return InitialAlphaPig
  }
}

class AlphaPigJourney extends SceneStateTransition<FishScene> {
  public async enter() {
    const scene = this.scene

    Inventory.instance.takeItem(Images.rudderIcon.key)

    await scene.playDialogJson('pigLeaves')

    scene.characters.alphapig.setActiveState('walking')

    await this.scene.tweens.create(scene.characters.alphapig).to({
      x: scene.game.width + Math.abs(scene.characters.alphapig.width * scene.characters.alphapig.anchor.x)
    }, 3000).start().onComplete.asPromise()

    return AlphaPigGone
  }
}

class AlphaPigGone extends SceneState<FishScene> {
  public async show() {
    this.scene.characters.alphapig.visible = false
  }
}

// ---------------------------------------------------------------------------
// Nailgoose States
// ---------------------------------------------------------------------------

class InitialNailgoose extends SceneState<FishScene> {
  public async show() {
    const scene = this.scene

    scene.characters.nailgoose.interactionEnabled = true

    this.listeners.push(scene.characters.nailgoose.events.onInputDown.addOnce(
      () => this.stateManager.trigger(NailgooseIntro)
    ))
  }
}

class NailgooseIntro extends SceneStateTransition<FishScene> {
  public async enter() {
    const scene = this.scene

    await Promise.race([scene.characters.nailgoose.setActiveState('smelling'), scene.clickedAnywhere()])
    await scene.playDialogJson('nailgooseIntro1')
    await Promise.race([scene.characters.nailgoose.setActiveState('smelling'), scene.clickedAnywhere()])
    await scene.playDialogJson('nailgooseIntro2')
    await Promise.race([scene.characters.nailgoose.setActiveState('smelling'), scene.clickedAnywhere()])
    await scene.playDialogJson('nailgooseIntro3')

    await Inventory.instance.addItem(Images.needle.key)

    return NailgooseWaiting
  }
}

class NailgooseWaiting extends SceneState<FishScene> {
  public async show() {
    const scene = this.scene

    scene.characters.nailgoose.interactionEnabled = true

    this.listeners.push(scene.characters.nailgoose.events.onInputDown.addOnce(
      () => this.stateManager.trigger(NailgooseStillWaiting)
    ))
  }
}

class NailgooseStillWaiting extends SceneStateTransition<FishScene> {
  public async enter() {
    const scene = this.scene

    await scene.playDialogJson('nailgooseStillWaiting')
    await Promise.race([scene.characters.nailgoose.setActiveState('smelling'), scene.clickedAnywhere()])

    return NailgooseWaiting
  }
}

class NailtreePlanted extends SceneState<FishScene> {
  public async show() {
    const scene = this.scene

    scene.characters.nailgoose.interactionEnabled = true

    this.listeners.push(scene.characters.nailgoose.events.onInputDown.addOnce(
      () => this.stateManager.trigger(NailgooseLeavingTowardsConcert)
    ))
  }
}

class NailgooseLeavingTowardsConcert extends SceneStateTransition<FishScene> {
  public async enter() {
    const scene = this.scene
    const antonius = scene.characters.antonius
    const nailgoose = scene.characters.nailgoose

    await scene.playDialogJson('nailgooseLeavingTowardsConcert')

    await antonius.setActiveState('walking')
    await nailgoose.setActiveState('walking')

    antonius.scale.x *= -1
    nailgoose.scale.x *= -1

    const antoniusOldX = antonius.position.x
    const nailgooseOldX = nailgoose.position.x

    await Promise.all([
      scene.tweens.create(nailgoose.position).to({ x: 425 }, 2000, Phaser.Easing.Linear.None, true).onComplete.asPromise(),
      scene.tweens.create(antonius.position).to({ x: 416 }, 2000, Phaser.Easing.Linear.None, true).onComplete.asPromise()
    ])

    antonius.visible = false
    nailgoose.visible = false

    antonius.position.x = antoniusOldX
    nailgoose.position.x = nailgooseOldX

    antonius.scale.x *= -1
    nailgoose.scale.x *= -1

    return NailgooseLeavingFish
  }
}

export class NailgooseLeavingFish extends SceneState<FishScene> {
  public async show() {
    const scene = this.scene

    scene.characters.nailgoose.visible = false
    scene.characters.antonius.visible = false

    scene.fadeTo('concert')
  }
}

class NailgooseLeftFish extends SceneState<FishScene> {
  public async show() {
    const scene = this.scene

    scene.characters.nailgoose.visible = false
  }
}
