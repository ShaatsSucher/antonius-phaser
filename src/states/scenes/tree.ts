import Scene from './scene'
import { SceneStateManager
       , SceneState
       , SceneStateTransition
       , ConditionalStateTransition
       , TransitionCondition
       } from '../../utils/stateManager'

import { Images, Audio } from '../../assets'

import AntoniusCharacter from '../../characters/antonius'
import TreeCharacter from '../../characters/tree'
import WomanCharacter from '../../characters/woman'
import GoatCharacter from '../../characters/goat'

import { BardGone, MeckieGone } from './bard'

import Arrow from '../../gameObjects/arrow'

import Inventory from '../../overlays/inventory'

export default class TreeScene extends Scene {
  public characters: {
    antonius: AntoniusCharacter,
    tree: TreeCharacter,
    woman: WomanCharacter,
    // goat: GoatCharacter
  } = <any>{}

  public interactiveObjects = {
    toBardArrow: null,
    toConcertArrow: null,
    toCanopyArrow: null,
    toCaveArrow: null
  }

  stateManagers: { [name: string]: SceneStateManager<TreeScene> } = {
    tree: new SceneStateManager<TreeScene>(this, [
      TreeWaitingForMeckieGone,
      TreeReadyToTalk,
      TreeWaitingForOwlGone,
      TreeWaitingForAllGone,
      AntoniusRequestedEntryForTheFirstTime,
      TreeDeniedEntry,
      TreeWillAllowEntry,
      TreeAllowedEntry
    ], [
      TreeAllowingAscend,
      TreeStillWaitingForOwlGone,
      AntoniusRequestsEntryForTheFirstTime,
      TreeDeniesEntry,
      AntoniusRequestsEntry,
      TreeOpeningUp
    ])
  }

  constructor(game: Phaser.Game) {
    super(
      game,
      Images.backgroundsWoman.key,
      Audio.soundscapesScene7.key
    )
  }

  protected registerConditionalStateTransitions(scenes: { [title: string]: Scene }) {
    const allGoneExceptTreeAndAntonius =
      TransitionCondition.reachedState(scenes.bard.stateManagers.meckie, MeckieGone)
        .and(TransitionCondition.reachedState(scenes.bard.stateManagers.bard, BardGone))
        // TODO: add all *Gone-states (except the ones for people on the forehead)

    this.stateManagers.tree.registerConditionalTransitions(
      new ConditionalStateTransition(
        TreeReadyToTalk,
        TransitionCondition.reachedState(scenes.bard.stateManagers.meckie, MeckieGone)
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
  }

  protected createGameObjects() {
    const antonius = this.characters.antonius = new AntoniusCharacter(this, 100, 100)
    antonius.scale = new Phaser.Point(-3, 3)
    this.game.add.existing(antonius)

    const tree = this.characters.tree = new TreeCharacter(this, 150, 0)
    tree.scale = new Phaser.Point(2, 2)
    this.game.add.existing(tree)

    const woman = this.characters.woman = new WomanCharacter(this, 250, 120)
    woman.scale = new Phaser.Point(3, 3)
    this.game.add.existing(woman)

    // const goat = this.characters.goat = new GoatCharacter(this, 280, 70)
    // goat.scale = new Phaser.Point(3, 3)
    // this.game.add.existing(goat)

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

class TreeWaitingForMeckieGone extends SceneState<TreeScene> {
  public async show() {
    this.scene.interactiveObjects.toCanopyArrow.visible = false
    this.scene.interactiveObjects.toCaveArrow.visible = false
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

    await scene.characters.tree.speech.say('Endlich ist der Verrückte mit dem Messer weg!', 1)
    await scene.characters.tree.speech.say('Ich hatte solche Angst um meine Rinde!', 1)
    await scene.characters.antonius.speech.say('Deine Rinde ist unversehrt.', null, 'sssllssl')
    await scene.characters.tree.speech.say('Aber sie ist sowas von schrumpelig...', 1)
    await scene.characters.antonius.speech.say('Überhaupt nicht.', null, 'ssll')
    await scene.characters.antonius.speech.say('Ich wollte fragen, ob ich\nin deine Baumhöhle darf.', null, 'ssslssslslslls')
    await scene.characters.tree.speech.say('Ach... Eher nicht.', 1)
    await scene.characters.tree.speech.say('Das wäre mir doch ein bisschen unangenehm...', 1)
    await scene.characters.antonius.speech.say('Kann ich verstehen.', null, 'slssl')
    await scene.characters.tree.speech.say('Aber... Ich könnte deine Hilfe gebrauchen...', 1)

    return TreeStillWaitingForOwlGone
  }
}

class TreeStillWaitingForOwlGone extends SceneStateTransition<TreeScene> {
  public async enter() {
    const scene = this.scene

    await scene.characters.tree.speech.say('Die Eule da oben...\nPisst mich einfach an.', 1)
    await scene.characters.antonius.speech.say('Ich schaue mal, was ich da tun kann.', null, 'sslllssls')

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

    await scene.characters.antonius.speech.say('Das Eulen-Problem ist gelöst.', null, 'sslslssl')
    await scene.characters.tree.speech.say('Antonius, mir fällt ein Stein vom Herzen!', 1)
    await scene.characters.antonius.speech.say('Ach, das hab ich doch gerne gemacht.', null, 'ssslsslsl')
    await scene.characters.tree.speech.say('Du hast so viel für mich getan.\nWie kann ich dir danken?', 1)
    await scene.characters.antonius.speech.say('Dürfte ich jetzt vielleicht\ndeine Baumhöhle betreten?', null, 'ssllslssslsssl')
    await scene.characters.tree.speech.say('Warum möchtest du das denn?', 1)
    await scene.characters.antonius.speech.say('Ich würde wirklich gerne\nmal eine von innen sehen.', null, 'lslslslssllsssl')

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

    await scene.characters.tree.speech.say('Ich würde dir ja gerne diesen Gefallen tun,\naber mir ist das schrecklich unangenehm,\nwenn mich jeder dabei sieht.', 1)
    await scene.characters.antonius.speech.say('Oh, verstehe.\nVielleicht später!', null, 'lsslsssl')

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

    await scene.characters.antonius.speech.say('Dürfte ich jetzt vielleicht\ndeine Baumhöhle betreten?', null, 'ssllslssslsssl')

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

    await scene.characters.antonius.speech.say('Dürfte ich jetzt vielleicht\ndeine Baumhöhle betreten?', null, 'ssllslssslsssl')
    await scene.characters.tree.speech.say('Wenn du das unbedingt möchtest...', 1)
    await scene.characters.tree.speech.say('Aber ich habe nicht aufgeräumt!', 1)
    await scene.characters.antonius.speech.say('Danke für dein Vertrauen.', null, 'ssslssl')

    return TreeAllowedEntry
  }
}

class TreeAllowedEntry extends SceneState<TreeScene> {
  public async show() {
    // No need to do anything, all arrows are automatically enabled
  }
}
