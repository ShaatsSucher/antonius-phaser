import Scene from './scene'
import { SceneStateManager
       , SceneState
       , SceneStateTransition
       , ConditionalStateTransition
       , TransitionCondition
       } from '../../utils/stateManager'

import { Images, Audio } from '../../assets'

import AntoniusCharacter from '../../characters/antonius'
import PainterCharacter from '../../characters/painter'
import BucketheadCharacter from '../../characters/buckethead'

import { HatPickedUp } from './canopy'
import { ColorPickedUp } from './cave'

import Arrow from '../../gameObjects/arrow'

import Inventory from '../../overlays/inventory'

export default class ForeheadScene extends Scene {
  public characters: {
    antonius: AntoniusCharacter,
    painter: PainterCharacter,
    buckethead: BucketheadCharacter
  } = <any>{}

  public interactiveObjects = {
    toCanopyArrow: null
  }

  stateManagers: { [name: string]: SceneStateManager<ForeheadScene> } = {
    painter: new SceneStateManager<ForeheadScene>(this, [
      PainterIsAnnoyed,
      PainterIsComplaining,
      PainterNeedsColor,
      AntoniusBroughtColor,
      PainterIsDoneWithPainting
    ], [
      PainterComplains,
      PainterAsksForColor,
      PainterPaints
    ]),
    buckethead: new SceneStateManager<ForeheadScene>(this, [
      BucketheadDingDingDing,
      BucketheadIsAnnoying,
      AntoniusBroughtHat,
      BucketheadIsStealthy
    ], [
      BucketheadAsksForHelp,
      BucketheadGetsAHat
    ])
  }

  constructor(game: Phaser.Game) {
    super(
      game,
      Images.backgroundsBackgroundStirn.key,
      Audio.soundscapesScene3.key // TODO: replace with soundscape for scene 2
    )
  }

  protected registerConditionalStateTransitions(scenes: { [title: string]: Scene }) {
    this.stateManagers.buckethead.registerConditionalTransitions(
      new ConditionalStateTransition(
        BucketheadIsAnnoying,
        TransitionCondition.reachedState(this.stateManagers.painter, PainterIsComplaining)
      ),
      new ConditionalStateTransition(
        AntoniusBroughtHat,
        TransitionCondition.reachedState(this.stateManagers.buckethead, BucketheadIsAnnoying)
        .and(TransitionCondition.reachedState(scenes.canopy.stateManagers.hat, HatPickedUp))
      )
    )

    this.stateManagers.painter.registerConditionalTransitions(
      new ConditionalStateTransition(
        PainterNeedsColor,
        TransitionCondition.reachedState(this.stateManagers.buckethead, BucketheadIsStealthy)
      ),
      new ConditionalStateTransition(
        AntoniusBroughtColor,
        TransitionCondition.reachedState(scenes.cave.stateManagers.color, ColorPickedUp)
      )
    )
  }

  protected createGameObjects() {
    const toCanopyArrow = this.interactiveObjects.toCanopyArrow = new Arrow(this.game, 364, 108)
    toCanopyArrow.interactionEnabled = true
    this.game.add.existing(toCanopyArrow)
    toCanopyArrow.events.onInputDown.addOnce(() => {
      toCanopyArrow.interactionEnabled = false
      this.fadeTo('canopy')
    })

    const antonius = this.characters.antonius = new AntoniusCharacter(this, 240, 100)
    antonius.scale.setTo(4)
    this.game.add.existing(antonius)

    const painter = this.characters.painter = new PainterCharacter(this, 45, 105)
    painter.scale.setTo(4)
    this.game.add.existing(painter)

    const bucket = this.characters.buckethead = new BucketheadCharacter(this, 150, 84)
    bucket.scale.setTo(4)
    this.game.add.existing(bucket)
  }

}

// ---------------------------------------------------------------------------
// Painter States
// ---------------------------------------------------------------------------

class PainterIsAnnoyed extends SceneState<ForeheadScene> {
  public async show() {
    const scene = this.scene

    scene.characters.painter.interactionEnabled = true
    this.listeners.push(scene.characters.painter.events.onInputUp.add(
      () => this.stateManager.trigger(PainterComplains)
    ))
  }
}

class PainterComplains extends SceneStateTransition<ForeheadScene> {
  public async enter() {
    const scene = this.scene

    await scene.characters.antonius.speech.say('Was malt Ihr da?', null, 'sssl')
    await scene.characters.painter.speech.say('Wie soll ich hier malen\nmit diesem Kerl neben mir?', 4, 'unsatisfied')
    await scene.characters.painter.speech.say('Kann dem nicht mal jemand\nden Eimer wegnehmen?', 4, 'unsatisfied')

    return PainterIsComplaining
  }
}

class PainterIsComplaining extends SceneState<ForeheadScene> {
  public async show() {
    const scene = this.scene

    scene.characters.painter.interactionEnabled = true
    this.listeners.push(scene.characters.painter.events.onInputUp.add(
      () => this.stateManager.trigger(PainterComplains)
    ))
  }
}

class PainterNeedsColor extends SceneState<ForeheadScene> {
  public async show() {
    const scene = this.scene

    scene.characters.painter.interactionEnabled = true
    this.listeners.push(scene.characters.painter.events.onInputUp.add(
      () => this.stateManager.trigger(PainterAsksForColor)
    ))
  }
}

class PainterAsksForColor extends SceneStateTransition<ForeheadScene> {
  public async enter() {
    const scene = this.scene

    await scene.characters.painter.speech.say('Ach, mit so wenigen Farben\nmacht das Malen keinen Spaß.', 4, 'unsatisfied')

    return PainterNeedsColor
  }
}

class AntoniusBroughtColor extends SceneState<ForeheadScene> {
  public async show() {
    const scene = this.scene

    scene.characters.painter.interactionEnabled = true
    this.listeners.push(scene.characters.painter.events.onInputUp.add(
      () => this.stateManager.trigger(PainterPaints)
    ))
  }
}

class PainterPaints extends SceneStateTransition<ForeheadScene> {
  public async enter() {
    const scene = this.scene

    await scene.characters.antonius.speech.say('Mit diesen leuchtenden Farben\ngelingt es bestimmt besser!', null, 'ssslsslslssslss')
    await scene.characters.painter.speech.say('Ich kann\'s ja mal probieren...', 3, 'unsatisfied')

    await scene.characters.painter.setActiveState('painting')
    await scene.wait(1)
    await scene.characters.painter.speech.say('Oh, so bunt!', 2, 'satisfied')
    await scene.characters.painter.setActiveState('painting')
    await scene.wait(1)
    await scene.characters.painter.speech.say('Wow!', 2, 'satisfied')
    await scene.characters.painter.setActiveState('painting')
    await scene.wait(1)
    await scene.characters.painter.speech.say('Ausgezeichnet!', 2, 'satisfied')

    return PainterIsDoneWithPainting
  }
}

class PainterIsDoneWithPainting extends SceneState<ForeheadScene> {
  public async show() {
    // TODO: display the picture in big
  }
}

// ---------------------------------------------------------------------------
// Buckethead States
// ---------------------------------------------------------------------------

class BucketheadDingDingDing extends SceneState<ForeheadScene> {
  public async show() { }
}

class BucketheadIsAnnoying extends SceneState<ForeheadScene> {
  public async show() {
    const scene = this.scene

    scene.characters.buckethead.interactionEnabled = true
    this.listeners.push(scene.characters.buckethead.events.onInputUp.add(
      () => this.stateManager.trigger(BucketheadAsksForHelp)
    ))
  }
}

class BucketheadAsksForHelp extends SceneStateTransition<ForeheadScene> {
  public async enter() {
    const scene = this.scene

    await scene.characters.antonius.speech.say('Ist das nicht unbequem mit\ndem Eimer auf dem Kopf?', null, 'slssslssslssl')
    await scene.characters.buckethead.speech.say('Ja, aber ich habe nichts anderes,\num mich vor dem Löffel zu schützen!', 5)

    return BucketheadIsAnnoying
  }
}

class AntoniusBroughtHat extends SceneState<ForeheadScene> {
  public async show() {
    const scene = this.scene

    scene.characters.buckethead.interactionEnabled = true
    this.listeners.push(scene.characters.buckethead.events.onInputUp.add(
      () => this.stateManager.trigger(BucketheadGetsAHat)
    ))
  }
}

class BucketheadGetsAHat extends SceneStateTransition<ForeheadScene> {
  public async enter() {
    const scene = this.scene

    await scene.characters.antonius.speech.say('Wie wäre es denn hiermit?', null, 'slssssl')
    Inventory.instance.takeItem(Images.hat.key)
    await scene.characters.buckethead.hatSpeech.say('Ja, der Hut sieht deutlich\nbesser aus!', 3)
    Inventory.instance.addItem(Images.bucket.key)

    return BucketheadIsStealthy
  }
}

export class BucketheadIsStealthy extends SceneState<ForeheadScene> {
  public async show() {
    this.scene.characters.buckethead.setActiveState('idleHat')
  }
}
