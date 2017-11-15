import Scene from './scene'
import { SceneStateManager
       , SceneState
       , SceneStateTransition
       , ConditionalStateTransition
       , TransitionCondition
       } from '../../utils/stateManager'
import { AntoniusBroughtFish } from './bard'
import { Silent } from './head'

import { Audio, Images, Json } from '../../assets'

import AntoniusCharacter from '../../characters/antonius'
import FishCharacter from '../../characters/fish'
import AlphaPigCharacter from '../../characters/alphapig'
import NailGooseCharacter from '../../characters/nailgoose'

import { WaitingForFish, CatInTheWay } from './bard'

import Arrow from '../../gameObjects/arrow'

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
    toKitchenArrow: null
  }

  readonly stateManagers: {
    [name: string]: SceneStateManager<FishScene>
  } = {
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
      AlphaPigWaiting,
      RuddersAvailable,
      AlphaPigGone
    ], [
      NotWithoutMyRudders,
      AlphaPigJourney
    ])
  }

  constructor(game: Phaser.Game) {
    super(
      game,
      Images.backgroundsFish.key,
      Audio.soundscapesScene9.key,
      Audio.musicHead.key,
      Json.dialogsFish.key
    )
  }

  protected registerConditionalStateTransitions(scenes: { [title: string]: Scene }) {
    this.stateManagers.fish.registerConditionalTransitions(
      new ConditionalStateTransition(
        FishDying,
        TransitionCondition.isState(this.stateManagers.fish, FishAlive)
        .and(TransitionCondition.reachedState(scenes.bard.stateManagers.meckie, WaitingForFish))
        .and(TransitionCondition.reachedState(scenes.bard.stateManagers.bard, CatInTheWay))
      )
    )
    this.stateManagers.alphapig.registerConditionalTransitions(
      new ConditionalStateTransition(
        RuddersAvailable,
        TransitionCondition.isState(this.stateManagers.alphapig, AlphaPigWaiting)
        .and(TransitionCondition.reachedState(this.stateManagers.fish, FishGone))
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

    // Add antonius
    const antonius = this.characters.antonius = new AntoniusCharacter(this, 280, 110)
    antonius.scale = new Phaser.Point(3, 3)
    antonius.setActiveState('idle')
    this.game.add.existing(antonius)

    const fish = this.characters.fish = new FishCharacter(this, 200, 120)
    fish.scale = new Phaser.Point(3, 3)
    this.game.add.existing(fish)

    const pig = this.characters.alphapig = new AlphaPigCharacter(this, 105, 130)
    pig.scale = new Phaser.Point(3, 3)
    this.game.add.existing(pig)

    const goose = this.characters.nailgoose = new NailGooseCharacter(this, 160, 80)
    goose.scale = new Phaser.Point(3, 3)
    this.game.add.existing(goose)
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

    Inventory.instance.addItem(Images.fish.key)

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
    const scene = this.scene

    scene.characters.alphapig.interactionEnabled = true

    this.listeners.push(scene.characters.alphapig.events.onInputDown.addOnce(
      () => this.stateManager.trigger(NotWithoutMyRudders)
    ))
  }
}

class NotWithoutMyRudders extends SceneStateTransition<FishScene> {
  public async enter() {
    const scene = this.scene

    await scene.playDialogJson('pigWontGo')

    return AlphaPigWaiting
  }
}

class AlphaPigWaiting extends SceneState<FishScene> {
  public async show() {
    const scene = this.scene

    scene.characters.alphapig.interactionEnabled = true

    this.listeners.push(scene.characters.alphapig.events.onInputDown.addOnce(
      () => this.stateManager.trigger(NotWithoutMyRudders)
    ))
  }
}

class RuddersAvailable extends SceneState<FishScene> {
  public async show() {
    this.scene.characters.alphapig.interactionEnabled = true
    this.listeners.push(this.scene.characters.alphapig.events.onInputDown.addOnce(
      () => this.stateManager.trigger(AlphaPigJourney)
    ))
  }
}

class AlphaPigJourney extends SceneStateTransition<FishScene> {
  public async enter() {
    const scene = this.scene

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
