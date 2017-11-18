import Scene from './scene'
import { SceneStateManager
       , SceneState
       , SceneStateTransition
       , ConditionalStateTransition
       , TransitionCondition
       } from '../../utils/stateManager'

import { WaitingForWater } from './kitchen'

import { Audio, Images, Spritesheets, Json } from '../../assets'

import AntoniusCharacter from '../../characters/antonius'
import TreeCharacter from '../../characters/tree'
import WomanCharacter from '../../characters/woman'
import GoatCharacter from '../../characters/goat'

import { BardGone, MeckieGone } from './bard'
import { OwlPeeingInBucket } from './canopy'
import { DoneCooking } from './kitchen'

import Arrow from '../../gameObjects/arrow'

import Inventory from '../../overlays/inventory'

export default class TreeScene extends Scene {
  public characters: {
    antonius: AntoniusCharacter,
    tree: TreeCharacter,
    woman: WomanCharacter,
    goat: GoatCharacter
  } = <any>{}

  public interactiveObjects = {
    toBardArrow: null,
    toConcertArrow: null,
    toCanopyArrow: null,
    toCaveArrow: null
  }

  stateManagers: { [name: string]: SceneStateManager<TreeScene> } = {
    tree: new SceneStateManager<TreeScene>(this, [
      InitialTree,
      TreeWaitingForMeckieGone,
      TreeReadyToTalk,
      TreeWaitingForOwlGone,
      TreeWaitingForAllGone,
      AntoniusRequestedEntryForTheFirstTime,
      TreeDeniedEntry,
      TreeWillAllowEntry,
      TreeAllowedEntry
    ], [
      TreeScaredOfMeckie,
      TreeStillWaitingForMeckieGone,
      TreeAllowingAscend,
      TreeStillWaitingForOwlGone,
      AntoniusRequestsEntryForTheFirstTime,
      TreeDeniesEntry,
      AntoniusRequestsEntry,
      TreeOpeningUp
    ]),
    woman: new SceneStateManager(this, [
      InitialWoman,
      HungryWoman,
      NewKnowledge,
      ImaptientWoman,
      SatisfiedWoman
    ], [
      IAmHungry,
      StillHungry,
      TakeMyCup,
      StillWaitig,
      Eating
    ]),
    goat: new SceneStateManager<TreeScene>(this, [
      Goat1,
      Goat2,
      Goat3,
      Goat4,
      Goat5,
      FinalGoat,
    ], [
      GoatTransition1,
      GoatTransition2,
      GoatTransition3,
      GoatTransition4,
      GoatTransition5,
      FinalGoatTransition
    ])
  }

  constructor(game: Phaser.Game) {
    super(
      game,
      Images.backgroundsBG03.key,
      Audio.soundscapesScene7.key,
      [],
      Json.dialogsTree.key
    )
  }

  protected registerConditionalStateTransitions(scenes: { [title: string]: Scene }) {
    const allGoneExceptTreeAndAntonius =
      TransitionCondition.reachedState(scenes.bard.stateManagers.meckie, MeckieGone)
        .and(TransitionCondition.reachedState(scenes.bard.stateManagers.bard, BardGone))
        .and(TransitionCondition.reachedState(scenes.tree.stateManagers.woman, SatisfiedWoman))
        .and(TransitionCondition.reachedState(scenes.kitchen.stateManagers.cooks, DoneCooking))
        // TODO: add all *Gone-states (except the ones for people on the forehead)

    this.stateManagers.tree.registerConditionalTransitions(
      new ConditionalStateTransition(
        TreeReadyToTalk,
        TransitionCondition.reachedState(scenes.bard.stateManagers.meckie, MeckieGone)
      ),
      new ConditionalStateTransition(
        TreeWaitingForAllGone,
        TransitionCondition.reachedState(scenes.canopy.stateManagers.owl, OwlPeeingInBucket)
      ),
      new ConditionalStateTransition(
        TreeDeniesEntry,
        TransitionCondition.reachedState(this.stateManagers.tree, AntoniusRequestedEntryForTheFirstTime)
          .and(allGoneExceptTreeAndAntonius.not()) // TODO: make sure this only triggers <= 1 times
      ),
      new ConditionalStateTransition(
        TreeOpeningUp,
        TransitionCondition.reachedState(this.stateManagers.tree, AntoniusRequestedEntryForTheFirstTime)
          .and(allGoneExceptTreeAndAntonius) // TODO: make sure this only triggers <= 1 times
          .and(TransitionCondition.reachedState(this.stateManagers.tree, TreeDeniedEntry).not())
      ),
      new ConditionalStateTransition(
        TreeWillAllowEntry,
        TransitionCondition.reachedState(this.stateManagers.tree, TreeDeniedEntry)
          .and(allGoneExceptTreeAndAntonius)
      )
    )

    this.stateManagers.woman.registerConditionalTransitions(
      new ConditionalStateTransition(
        NewKnowledge,
        TransitionCondition.reachedState(scenes.kitchen.stateManagers.cooks, WaitingForWater)
      )
    )
  }

  protected createGameObjects() {
    const tree = this.characters.tree = new TreeCharacter(this, 112, -2)
    tree.scale.setTo(2)
    this.game.add.existing(tree)

    const woman = this.characters.woman = new WomanCharacter(this, 175, 110)
    woman.scale.setTo(2)
    this.game.add.existing(woman)

    const goat = this.characters.goat = new GoatCharacter(this, 260, 76)
    goat.scale.setTo(2)
    this.game.add.existing(goat)

    const antonius = this.characters.antonius = new AntoniusCharacter(this, 160, 115)
    antonius.scale = new Phaser.Point(-2, 2)
    this.game.add.existing(antonius)

    const toBardArrow = this.interactiveObjects.toBardArrow = new Arrow(this.game, 20, 95)
    toBardArrow.rotation = Math.PI
    toBardArrow.interactionEnabled = true
    this.game.add.existing(toBardArrow)
    toBardArrow.events.onInputDown.addOnce(() => {
      toBardArrow.interactionEnabled = false
      this.fadeTo('bard')
    })

    const toConcertArrow = this.interactiveObjects.toConcertArrow = new Arrow(this.game, 190, 200)
    toConcertArrow.rotation = Math.PI / 2
    toConcertArrow.interactionEnabled = true
    this.game.add.existing(toConcertArrow)
    toConcertArrow.events.onInputDown.addOnce(() => {
      toBardArrow.interactionEnabled = false
      this.fadeTo('concert')
    })

    const toCanopyArrow = this.interactiveObjects.toCanopyArrow = new Arrow(this.game, 190, 20)
    toCanopyArrow.rotation = - Math.PI / 2
    toCanopyArrow.interactionEnabled = true
    this.game.add.existing(toCanopyArrow)
    toCanopyArrow.events.onInputDown.addOnce(() => {
      toBardArrow.interactionEnabled = false
      this.fadeTo('canopy')
    })

    const toCaveArrow = this.interactiveObjects.toCaveArrow = new Arrow(this.game, 364, 95)
    toCaveArrow.interactionEnabled = true
    this.game.add.existing(toCaveArrow)
    toCaveArrow.events.onInputDown.addOnce(() => {
      toCaveArrow.interactionEnabled = false
      this.fadeTo('cave')
    })
  }
}

// ---------------------------------------------------------------------------
// Tree States
// ---------------------------------------------------------------------------

class InitialTree extends SceneState<TreeScene> {
  public async show() {
    const scene = this.scene

    scene.characters.tree.interactionEnabled = true

    scene.interactiveObjects.toCanopyArrow.visible = false
    scene.interactiveObjects.toCaveArrow.visible = false

    this.listeners.push(scene.characters.tree.events.onInputUp.addOnce(
      () => this.stateManager.trigger(TreeScaredOfMeckie)
    ))
  }
}

class TreeScaredOfMeckie extends SceneStateTransition<TreeScene> {
  public async enter() {
    const scene = this.scene

    await scene.playDialogJson('treeScaredOfMeckie')

    return TreeWaitingForMeckieGone
  }
}

class TreeWaitingForMeckieGone extends SceneState<TreeScene> {
  public async show() {
    const scene = this.scene

    scene.interactiveObjects.toCanopyArrow.visible = false
    scene.interactiveObjects.toCaveArrow.visible = false

    scene.characters.tree.interactionEnabled = true
    this.listeners.push(scene.characters.tree.events.onInputUp.addOnce(
      () => this.stateManager.trigger(TreeStillWaitingForMeckieGone)
    ))
  }
}

class TreeStillWaitingForMeckieGone extends SceneStateTransition<TreeScene> {
  public async enter() {
    const scene = this.scene

    await scene.playDialogJson('treeWaitingForMeckieGone')

    return TreeWaitingForMeckieGone
  }
}

class TreeReadyToTalk extends SceneState<TreeScene> {
  public async show() {
    this.scene.interactiveObjects.toCanopyArrow.visible = false
    this.scene.interactiveObjects.toCaveArrow.visible = false

    this.scene.characters.tree.interactionEnabled = true
    this.listeners.push(this.scene.characters.tree.events.onInputUp.addOnce(
      () => this.stateManager.trigger(TreeAllowingAscend)
    ))
  }
}

class TreeAllowingAscend extends SceneStateTransition<TreeScene> {
  public async enter() {
    const scene = this.scene

    await scene.playDialogJson('treeAllowingAscend')

    return TreeStillWaitingForOwlGone
  }
}

class TreeStillWaitingForOwlGone extends SceneStateTransition<TreeScene> {
  public async enter() {
    const scene = this.scene

    await scene.playDialogJson('treeWantsOwlGone')

    return TreeWaitingForOwlGone
  }
}

class TreeWaitingForOwlGone extends SceneState<TreeScene> {
  public async show() {
    this.scene.interactiveObjects.toCaveArrow.visible = false

    this.scene.characters.tree.interactionEnabled = true
    this.listeners.push(this.scene.characters.tree.events.onInputUp.add(
      () => this.stateManager.trigger(TreeStillWaitingForOwlGone)
    ))
  }
}

class TreeWaitingForAllGone extends SceneState<TreeScene> {
  public async show() {
    this.scene.interactiveObjects.toCaveArrow.visible = false

    this.scene.characters.tree.interactionEnabled = true
    this.listeners.push(this.scene.characters.tree.events.onInputUp.add(
      () => this.stateManager.trigger(AntoniusRequestsEntryForTheFirstTime)
    ))
  }
}

class AntoniusRequestsEntryForTheFirstTime extends SceneStateTransition<TreeScene> {
  public async enter() {
    const scene = this.scene

    await scene.playDialogJson('antoniusRequestsEntryForTheFirstTime')

    return AntoniusRequestedEntryForTheFirstTime
  }
}

class AntoniusRequestedEntryForTheFirstTime extends SceneState<TreeScene> {
  public async enter() {
    this.scene.interactiveObjects.toCaveArrow.visible = false
  }
}

class TreeDeniesEntry extends SceneStateTransition<TreeScene> {
  public async enter() {
    const scene = this.scene

    await scene.playDialogJson('treeDeniesEntry')

    return TreeDeniedEntry
  }
}

class TreeDeniedEntry extends SceneState<TreeScene> {
  public async show() {
    this.scene.interactiveObjects.toCaveArrow.visible = false

    this.scene.characters.tree.interactionEnabled = true
    this.listeners.push(this.scene.characters.tree.events.onInputUp.add(
      () => this.stateManager.trigger(AntoniusRequestsEntry)
    ))
  }
}

class AntoniusRequestsEntry extends SceneStateTransition<TreeScene> {
  public async enter() {
    const scene = this.scene

    await scene.playDialogJson('antoniusRequestsEntry')

    return TreeDeniesEntry
  }
}

class TreeWillAllowEntry extends SceneState<TreeScene> {
  public async show() {
    this.scene.interactiveObjects.toCaveArrow.visible = false

    this.scene.characters.tree.interactionEnabled = true
    this.listeners.push(this.scene.characters.tree.events.onInputUp.add(
      () => this.stateManager.trigger(TreeOpeningUp)
    ))
  }
}

class TreeOpeningUp extends SceneStateTransition<TreeScene> {
  public async enter() {
    const scene = this.scene

    await scene.playDialogJson('treeOpeningUp')

    await scene.characters.tree.setActiveState('opening')
    await scene.wait(1)

    return TreeAllowedEntry
  }
}

class TreeAllowedEntry extends SceneState<TreeScene> {
  public async show() {
    await this.scene.characters.tree.setActiveState('idleOpen')
  }
}



// ---------------------------------------------------------------------------
// Woman States
// ---------------------------------------------------------------------------

export class InitialWoman extends SceneState<TreeScene> {
  public async show() {
    const c = this.scene.characters

    c.woman.interactionEnabled = true

    this.listeners.push(c.woman.events.onInputUp.addOnce(
      () => this.stateManager.trigger(IAmHungry)
    ))
  }
}

class IAmHungry extends SceneStateTransition<TreeScene> {
  async enter() {
    const scene = this.scene

    await scene.playDialogJson('womenIsHungry')

    return HungryWoman
  }
}

export class HungryWoman extends SceneState<TreeScene> {
  public async show() {
      const c = this.scene.characters

      c.woman.interactionEnabled = true

      this.listeners.push(c.woman.events.onInputUp.addOnce(
        () => this.stateManager.trigger(StillHungry)
      ))
    }
  }

class StillHungry extends SceneStateTransition<TreeScene> {
  async enter() {
    const scene = this.scene

    await scene.playDialogJson('womenIsStillHungry')

    return HungryWoman
  }
}

export class NewKnowledge extends SceneState<TreeScene> {
  public async show() {
    const c = this.scene.characters

    console.log('KNEW KNOWLEDGE ACQUIRED!')

    c.woman.interactionEnabled = true

    this.listeners.push(c.woman.events.onInputUp.addOnce(
      () => this.stateManager.trigger(TakeMyCup)
    ))
  }
}

class TakeMyCup extends SceneStateTransition<TreeScene> {
  async enter() {
    const scene = this.scene

    await scene.playDialogJson('antoniusOffersToGetFood')

    // await Inventory.instance.pickupItem(scene.characters.woman, this.scene, Images.cupEmpty.key)
    Inventory.instance.addItem(Images.cupEmpty.key)

    return ImaptientWoman
  }
}

export class ImaptientWoman extends SceneState<TreeScene> {
  public async show() {
    const c = this.scene.characters

    c.woman.loadTexture(Spritesheets.ladynocup.key)

    c.woman.interactionEnabled = true

    this.listeners.push(this.scene.addItemDropHandler(c.woman, async (key) => {
      if (key !== Images.cupSoup.key) return false
      Inventory.instance.takeItem(Images.cupSoup.key)
      this.stateManager.trigger(Eating)
      return true
    }))

    this.listeners.push(c.woman.events.onInputUp.addOnce(
      () => this.stateManager.trigger(StillWaitig)
    ))
  }
}

class StillWaitig extends SceneStateTransition<TreeScene> {
  async enter() {
    const scene = this.scene

    await scene.playDialogJson('womanWaitsForSoup')

    return ImaptientWoman
  }
}

class Eating extends SceneStateTransition<TreeScene> {
  async enter() {
    const scene = this.scene
    const c = scene.characters

    await scene.playDialogJson('womanEatsSoup')

    c.woman.setActiveState('walking')

    await scene.tweens.create(c.woman).to({
      x: -200
    }, 4000).start().onComplete.asPromise()

    await scene.playDialogJson('antoniusWondersAboutWomansInvitation')

    return SatisfiedWoman
  }
}

export class SatisfiedWoman extends SceneState<TreeScene> {
  public async show() {
    this.scene.characters.woman.visible = false
  }
}

// ---------------------------------------------------------------------------
// Goat States
// ---------------------------------------------------------------------------

class Goat1 extends SceneState<TreeScene> {
  public async show() {
    const goat = this.scene.characters.goat
    goat.interactionEnabled = true

    this.listeners.push(goat.events.onInputUp.addOnce(() => {
      this.stateManager.trigger(GoatTransition1)
    }))
  }
}

class GoatTransition1 extends SceneStateTransition<TreeScene> {
  public async enter() {
    await this.scene.playDialogJson('goat1')

    return Goat2
  }
}

class Goat2 extends SceneState<TreeScene> {
  public async show() {
    const goat = this.scene.characters.goat
    goat.interactionEnabled = true

    this.listeners.push(goat.events.onInputUp.addOnce(() => {
      this.stateManager.trigger(GoatTransition2)
    }))
  }
}

class GoatTransition2 extends SceneStateTransition<TreeScene> {
  public async enter() {
    await this.scene.playDialogJson('goat2')

    return Goat3
  }
}

class Goat3 extends SceneState<TreeScene> {
  public async show() {
    const goat = this.scene.characters.goat
    goat.interactionEnabled = true

    this.listeners.push(goat.events.onInputUp.addOnce(() => {
      this.stateManager.trigger(GoatTransition3)
    }))
  }
}

class GoatTransition3 extends SceneStateTransition<TreeScene> {
  public async enter() {
    await this.scene.playDialogJson('goat3')

    return Goat4
  }
}

class Goat4 extends SceneState<TreeScene> {
  public async show() {
    const goat = this.scene.characters.goat
    goat.interactionEnabled = true

    this.listeners.push(goat.events.onInputUp.addOnce(() => {
      this.stateManager.trigger(GoatTransition4)
    }))
  }
}

class GoatTransition4 extends SceneStateTransition<TreeScene> {
  public async enter() {
    await this.scene.playDialogJson('goat4')

    return Goat5
  }
}

class Goat5 extends SceneState<TreeScene> {
  public async show() {
    const goat = this.scene.characters.goat
    goat.interactionEnabled = true

    this.listeners.push(goat.events.onInputUp.addOnce(() => {
      this.stateManager.trigger(GoatTransition5)
    }))
  }
}

class GoatTransition5 extends SceneStateTransition<TreeScene> {
  public async enter() {
    await this.scene.playDialogJson('goat5')

    return FinalGoat
  }
}

class FinalGoat extends SceneState<TreeScene> {
  public async show() {
    const goat = this.scene.characters.goat
    goat.interactionEnabled = true

    this.listeners.push(goat.events.onInputUp.addOnce(() => {
      this.stateManager.trigger(FinalGoatTransition)
    }))
  }
}

class FinalGoatTransition extends SceneStateTransition<TreeScene> {
  public async enter() {
    await this.scene.playDialogJson('finalGoat')

    return FinalGoat
  }
}
