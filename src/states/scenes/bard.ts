import Scene from './scene'
import { SceneStateManager
       , SceneState
       , SceneStateTransition
       , ConditionalStateTransition
       , TransitionCondition
       } from '../../utils/stateManager'

import { FishHintAvailable, Suction } from './head'
import { FishAlive, FishDying } from './fish'

import { Audio, Images, Json } from '../../assets'

import AntoniusCharacter from '../../characters/antonius'
import BardCharacter from '../../characters/bard'
import GooseCharacter from '../../characters/goose'
import CatCharacter from '../../characters/cat'
import MeckieCharacter from '../../characters/meckie'

import { FishGone } from './fish'
import { VeggiesPickedUp } from './concert'

import Arrow from '../../gameObjects/arrow'

import SheechHelper from '../../utils/speechHelper'
import { AudioManager } from '../../utils/audioManager'

import Inventory from '../../overlays/inventory'
import { ArrayUtils, StringUtils } from '../../utils/utils'

export default class BardScene extends Scene {
  public characters: {
    antonius: AntoniusCharacter,
    goose: GooseCharacter,
    bard: BardCharacter,
    cat: CatCharacter,
    meckie: MeckieCharacter
  } = <any>{}

  public interactiveObjects = {
    toHeadArrow: null,
    toKitchenArrow: null,
    toTreeArrow: null
  }

  readonly stateManagers: { [name: string]: SceneStateManager<BardScene> } = {
    bard: new SceneStateManager<BardScene>(this, [
      InitialBard,
      CatInTheWay,
      CatGone,
      FiletInThePocket,
      BardGone
    ], [
      BardConversation,
      AnnoyedCat,
      SadBard,
      CatFeast,
      HelloThere
    ]),
    meckie: new SceneStateManager<BardScene>(this, [
      InitialMeckie,
      WaitingForFish,
      AntoniusBroughtFish,
      WaitingForVeggies,
      AntoniusBroughtVeggies,
      MeckieGone
    ], [
      MeckieIntroduction,
      MeckieRequest,
      CutFish,
      RequestingVeggies,
      CuttingVeggies
    ])
  }

  constructor(game: Phaser.Game) {
    super(game, Images.backgroundsBG02.key, Audio.soundscapesScene6.key, [], Json.dialogsBard.key)
  }

  protected registerConditionalStateTransitions(scenes: { [title: string]: Scene }) {
    this.stateManagers.bard.registerConditionalTransitions(
      new ConditionalStateTransition(
        FiletInThePocket,
        TransitionCondition.reachedState(this.stateManagers.meckie, WaitingForVeggies)
      )
    )

    this.stateManagers.meckie.registerConditionalTransitions(
      new ConditionalStateTransition(
        AntoniusBroughtFish,
        TransitionCondition.isState(this.stateManagers.meckie, WaitingForFish)
        .and(TransitionCondition.reachedState(scenes.fish.stateManagers.fish, FishGone))
      ),
      new ConditionalStateTransition(
        AntoniusBroughtVeggies,
        TransitionCondition.reachedState(this.stateManagers.meckie, WaitingForVeggies)
        .and(TransitionCondition.reachedState(scenes.concert.stateManagers.veggies, VeggiesPickedUp))
      )
    )
  }

  protected createGameObjects() {
    const goose = this.characters.goose = new GooseCharacter(this, 144, 10)
    goose.scale = new Phaser.Point(3, 3)
    goose.anchor.setTo(0.5, 0)
    goose.setActiveState('idle')
    goose.inputEnabled = false
    this.add.existing(goose)

    const bard = this.characters.bard = new BardCharacter(this, 144, 10)
    bard.scale = new Phaser.Point(3, 3)
    bard.anchor.setTo(0.5, 0)
    bard.setActiveState('idle')
    this.add.existing(bard)

    const cat = this.characters.cat = new CatCharacter(this, 144, 64)
    cat.scale = new Phaser.Point(3, 3)
    cat.anchor.setTo(0.5, 0)
    cat.setActiveState('idle')
    this.add.existing(cat)

    const meckie = this.characters.meckie = new MeckieCharacter(this, 78, 120)
    meckie.scale = new Phaser.Point(3, 3)
    meckie.anchor.setTo(0.5, 0)
    meckie.setActiveState('idle')
    this.add.existing(meckie)

    const antonius = this.characters.antonius = new AntoniusCharacter(this, 292, 120)
    antonius.scale = new Phaser.Point(3, 3)
    antonius.setActiveState('idle')
    this.add.existing(antonius)

    const toHeadArrow = this.interactiveObjects.toHeadArrow = new Arrow(this.game, 20, 95)
    toHeadArrow.rotation = Math.PI
    toHeadArrow.interactionEnabled = true
    this.game.add.existing(toHeadArrow)
    toHeadArrow.events.onInputDown.addOnce(() => {
      toHeadArrow.interactionEnabled = false
      this.fadeTo('head')
    })

    const toKitchenArrow = this.interactiveObjects.toKitchenArrow = new Arrow(this.game, 192, 196)
    toKitchenArrow.rotation = Math.PI / 2
    toKitchenArrow.interactionEnabled = true
    this.game.add.existing(toKitchenArrow)
    toKitchenArrow.events.onInputDown.addOnce(() => {
      toKitchenArrow.interactionEnabled = false
      this.fadeTo('kitchen')
    })

    const toTreeArrow = this.interactiveObjects.toTreeArrow = new Arrow(this.game, 364, 95)
    toTreeArrow.interactionEnabled = true
    this.game.add.existing(toTreeArrow)
    toTreeArrow.events.onInputDown.addOnce(() => {
      toTreeArrow.interactionEnabled = false
      this.fadeTo('tree')
    })
  }
}

export class InitialBard extends SceneState<BardScene> {
  public async show() {
    const scene = this.scene

    this.scene.setMusicClips([])

    scene.characters.bard.interactionEnabled = true

    this.listeners.push(scene.characters.bard.events.onInputUp.addOnce(
      () => scene.stateManagers.bard.trigger(BardConversation)
    ))
  }
}

class BardConversation extends SceneStateTransition<BardScene> {
  public async enter() {
    const scene = this.scene

    scene.characters.bard.setActiveState('singing')
    scene.characters.bard.interactionEnabled = true
    const bardSong = AudioManager.instance.tracks.speech.addClip(Audio.bardSongShort.key)
    bardSong.stopped.then(() => { scene.characters.bard.setActiveState('idle') })

    await scene.clickedAnywhere()
    bardSong.stop()
    scene.characters.bard.setInteractionEnabled(false)

    this.scene.setMusicClips(Audio.musicBard.key)

    await scene.playDialogJson('bardIntro')

    return CatInTheWay
  }
}

export class CatInTheWay extends SceneState<BardScene> {
  public async show() {
    const scene = this.scene

    this.scene.setMusicClips(Audio.musicBard.key)

    scene.characters.cat.interactionEnabled = true
    this.listeners.push(scene.characters.cat.events.onInputUp.addOnce(
      () => scene.stateManagers.bard.trigger(AnnoyedCat)
    ))

    scene.characters.bard.interactionEnabled = true
    this.listeners.push(scene.characters.bard.events.onInputUp.addOnce(
      () => scene.stateManagers.bard.trigger(SadBard)
    ))
  }
}

class AnnoyedCat extends SceneStateTransition<BardScene> {
  public async enter() {
    const scene = this.scene

    await scene.playDialogJson('annoyedCat')

    return CatInTheWay
  }
}

class SadBard extends SceneStateTransition<BardScene> {
  public async enter() {
    const scene = this.scene

    await scene.playDialogJson('sadBard')

    return CatInTheWay
  }
}

export class FiletInThePocket extends SceneState<BardScene> {
  public async show() {
    const scene = this.scene

    scene.characters.cat.interactionEnabled = true
    this.clearListeners()
    this.listeners.push(scene.characters.cat.events.onInputUp.addOnce(
      () => { this.stateManager.trigger(CatFeast) }
    ))
  }
}

class CatFeast extends SceneStateTransition<BardScene> {
  public async enter() {
    const scene = this.scene

    await scene.playDialogJson('catFeastBeforeAccepted')

    await scene.wait(0.5)
    Inventory.instance.takeItem(Images.filet.key)
    await scene.wait(0.5)

    await scene.playDialogJson('catFeastAfterAccepted')

    await scene.tweens.create(scene.characters.cat).to({
      y: 150
    }, 500, i => (1 + 2 / 3) * i * i - (2 / 3) * i).start().onComplete.asPromise()

    scene.characters.cat.scale.x =  -3
    scene.characters.cat.setActiveState('walking')
    await scene.tweens.create(scene.characters.cat).to({
      x: -Math.abs(scene.characters.cat.width * scene.characters.cat.anchor.x)
    }, 3000).start().onComplete.asPromise()

    return CatGone
  }
}

export class CatGone extends SceneState<BardScene> {
  public async show() {
    const scene = this.scene

    scene.characters.cat.visible = false
    scene.characters.bard.interactionEnabled = true
    this.listeners.push(scene.characters.bard.events.onInputUp.addOnce(
      () => this.stateManager.trigger(HelloThere)
    ))
  }
}

class HelloThere extends SceneStateTransition<BardScene> {
  public async enter() {
    const scene = this.scene

    scene.characters.cat.visible = false

    await scene.playDialogJson('catGoneBeforeReversal')

    scene.characters.bard.scale.x = -3
    scene.characters.bard.x = 124
    scene.characters.bard.y = 7
    await scene.wait(0.5)

    await scene.playDialogJson('catGoneAfterReversal')

    scene.characters.bard.scale.x = 3
    scene.characters.bard.x = 164
    scene.characters.goose.scale.x = -3
    scene.characters.bard.setActiveState('walking')
    scene.characters.goose.setActiveState('walking')

    // This is a hacky way to make the goose only move while it is jumping.
    // (Frames 1 through 4: on the ground. Frames 5 through 7: in the air.)
    // Doesn't always work in reality, since it is not actually synced with the
    // animation, so depending on timing issues, the movement looks better or
    // worse.
    const interpolate = t => {
      if (t < 4 / 7 / 3) return 0
      if (t < 1 / 3) return t * 7 / 3 - 4 / 9
      if (t < 11 / 7 / 3) return 1 / 3
      if (t < 2 / 3) return t * 7 / 3 - 8 / 9
      if (t < 18 / 7 / 3) return 2 / 3
      return t * 7 / 3 - 12 / 9
    }

    const xmin = -Math.abs((1 - scene.characters.goose.anchor.x) * scene.characters.goose.width)
    await Promise.all([
      scene.tweens.create(scene.characters.goose).to({ x: xmin }, 3000, interpolate).start().onComplete.asPromise(),
      scene.tweens.create(scene.characters.bard).to({ x: xmin }, 3000, interpolate).start().onComplete.asPromise()
    ])

    return BardGone
  }
}

export class BardGone extends SceneState<BardScene> {
  public async show() {
    const scene = this.scene

    scene.characters.cat.visible = false
    scene.characters.goose.visible = false
    scene.characters.bard.visible = false
  }
}



export class InitialMeckie extends SceneState<BardScene> {
  public async show() {
    const scene = this.scene

    scene.characters.meckie.interactionEnabled = true
    this.listeners.push(scene.characters.meckie.events.onInputUp.addOnce(
      () => this.stateManager.trigger(MeckieIntroduction)
    ))
  }
}

class MeckieIntroduction extends SceneStateTransition<BardScene> {
  public async enter() {
    const scene = this.scene

    await scene.playDialogJson('meckieIntro')

    return MeckieRequest
  }
}

class MeckieRequest extends SceneStateTransition<BardScene> {
  public async enter() {
    const scene = this.scene

    await scene.playDialogJson('meckieRequest')

    return WaitingForFish
  }
}

export class WaitingForFish extends SceneState<BardScene> {
  public async show() {
    const scene = this.scene

    scene.characters.meckie.interactionEnabled = true
    this.listeners.push(scene.characters.meckie.events.onInputDown.addOnce(
      () => this.stateManager.trigger(MeckieRequest)
    ))
  }
}

export class AntoniusBroughtFish extends SceneState<BardScene> {
  public async show() {
    const scene = this.scene

    scene.characters.meckie.interactionEnabled = true
    this.listeners.push(scene.characters.meckie.events.onInputUp.addOnce(
      () => this.stateManager.trigger(CutFish)
    ))
  }
}

class CutFish extends SceneStateTransition<BardScene> {
  public async enter() {
    const scene = this.scene

    await scene.playDialogJson('cutFishBeforeCutting')

    Inventory.instance.takeItem(Images.fish.key)

    scene.characters.meckie.setActiveState('swinging')
    await scene.wait(1)

    await scene.playDialogJson('cutFishAfterCutting')

    Inventory.instance.addItem(Images.filet.key, 2)

    await scene.playDialogJson('cutFishAfterPickup')

    return WaitingForVeggies
  }
}

class WaitingForVeggies extends SceneState<BardScene> {
  public async show() {
    const scene = this.scene

    scene.characters.meckie.interactionEnabled = true
    this.listeners.push(scene.characters.meckie.events.onInputUp.addOnce(
      () => this.stateManager.trigger(RequestingVeggies)
    ))
  }
}

class RequestingVeggies extends SceneStateTransition<BardScene> {
  public async enter() {
    const scene = this.scene

    await scene.playDialogJson('requestingVeggies')

    return WaitingForVeggies
  }
}

class AntoniusBroughtVeggies extends SceneState<BardScene> {
  public async show() {
    const scene = this.scene

    scene.characters.meckie.interactionEnabled = true
    this.listeners.push(scene.characters.meckie.events.onInputUp.addOnce(
      () => this.stateManager.trigger(CuttingVeggies)
    ))
  }
}

class CuttingVeggies extends SceneStateTransition<BardScene> {
  public async enter() {
    const scene = this.scene

    await scene.playDialogJson('cuttingVeggiesBeforeCutting')

    Inventory.instance.takeItem(Images.veggies.key)

    scene.characters.meckie.setActiveState('swinging')
    await scene.wait(1)

    Inventory.instance.addItem(Images.slicedVeggies.key)

    await scene.playDialogJson('cuttingVeggiesAfterCutting')

    scene.characters.meckie.scale.x = -3
    scene.characters.meckie.setActiveState('walking')

    await this.scene.tweens.create(scene.characters.meckie).to({
      x: -Math.abs(scene.characters.meckie.width * scene.characters.meckie.anchor.x)
    }, 3000).start().onComplete.asPromise()

    return MeckieGone
  }
}

export class MeckieGone extends SceneState<BardScene> {
  public async show() {
    const scene = this.scene
    scene.characters.meckie.visible = false
  }
}
