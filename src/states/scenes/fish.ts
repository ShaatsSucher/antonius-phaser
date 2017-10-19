import Scene from './scene'
import { SceneStateManager
       , SceneState
       , SceneStateTransition
       , ConditionalStateTransition
       , TransitionCondition
       } from '../../utils/stateManager'
import { AntoniusBroughtFish } from './bard'
import { Silent } from './head'

import { Images, Audio } from '../../assets'

import AntoniusCharacter from '../../characters/antonius'
import FishCharacter from '../../characters/fish'
import AlphaPigCharacter from '../../characters/alphapig'
import NailGooseCharacter from '../../characters/nailgoose'

import { WaitingForFish, CatInTheWay } from './bard'

import Arrow from '../../gameObjects/arrow'

import Inventory from '../../overlays/inventory'
import { ArrayUtils, StringUtils } from '../../utils/utils'

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
      Audio.musicHeadScreen.key
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

    await scene.characters.antonius.speech.say('Ach, ich dachte doch\nirgendwas riecht hier fischig', null, 'ssslsss')
    await scene.characters.fish.speech.say('Ent-schul-di-gung, aber was so "fischig"\nriecht ist ein Canal No. 5!', 10)
    await scene.characters.antonius.speech.say('Oh, du sprichst!', null, 'lss')
    await scene.characters.fish.speech.say('Nicht nur spreche ich, ich atme Luft!\nWasser ist ja *schnauf* so was von altmodisch.', 8)
    await scene.characters.fish.speech.say('Frischluft, *röchel* das atmet man heutzutage!', 6)
    await scene.characters.antonius.speech.say('Sicher, dass es dir gut geht?\nDu siehst ein bisschen blass um die Kiemen aus...', null, 'ssslsls')

    return ImFine
  }
}

class ImFine extends SceneStateTransition<FishScene> {
  public async enter() {
    const scene = this.scene

    await scene.characters.fish.speech.say('Mir geht es *keuch* BLEN-DEND!', 5)

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

    await scene.characters.fish.speech.say('Luft atmen ist *japs* gesund!', 4)
    await scene.characters.fish.speech.say('Es verjüngt die Haut, es reinigt die Poren,\nalles dank der Lunge!', 6)
    await scene.characters.fish.speech.say('... Moment, hab ich eigentlich eine Lunge?', 5)

    await scene.characters.fish.setActiveState('dying')
    const deathSound = scene.sound.play(Audio.fishFishDiesFishDies.key)

    let soundDoneCallback: () => void
    const soundDone = new Promise<void>(resolve => { soundDoneCallback = resolve })
    deathSound.onStop.addOnce(soundDoneCallback)

    await soundDone

    await scene.characters.antonius.speech.say('Hmm… alles Teil von Gottes Plan. Ganz bestimmt.', null, 'sssssl')

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

    await scene.characters.alphapig.speech.say('Ich gehe hier nicht weg.\nNicht ohne meine Ruder!', null, 4)

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

    await scene.characters.alphapig.speech.say('Oh, meine Ruder sind wieder frei!', 3)
    await scene.characters.antonius.speech.say('Wolltest du denn wegfahren?', null, 'slslsl')
    await scene.characters.alphapig.speech.say('Nein, ich wollte nur meine Ruder!', 3)

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
