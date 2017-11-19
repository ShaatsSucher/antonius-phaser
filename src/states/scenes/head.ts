import Scene from './scene'
import { SceneStateManager
       , SceneState
       , SceneStateTransition
       , ConditionalStateTransition
       , TransitionCondition
       } from '../../utils/stateManager'

import { Audio, CustomWebFonts, Images, Json, Spritesheets } from '../../assets'

import HellmouthCharacter from '../../characters/hellmouth'
import AntoniusCharacter from '../../characters/antonius'

import { FishDead } from './fish'
import { CatInTheWay, BardGone, MeckieGone } from './bard'

import Character from '../../characters/character'
import AlphapigCharacter from '../../characters/alphapig'
import NailgooseCharacter from '../../characters/nailgoose'
import SwanCharacter from '../../characters/swan'
import BardCharacter from '../../characters/bard'
import GooseCharacter from '../../characters/goose'
import CatCharacter from '../../characters/cat'
import MeckieCharacter from '../../characters/meckie'
import Cook1Character from '../../characters/cook1'
import Cook2Character from '../../characters/cook2'
import WomanCharacter from '../../characters/woman'
import PainterCharacter from '../../characters/painter'
import BucketheadCharacter from '../../characters/buckethead'
import FightCloudCharacter from '../../characters/fightcloud'

import { HatPickedUp } from './canopy'
import { ColorPickedUp } from './cave'

import gameObject from '../../gameObjects/gameObject'
import Arrow from '../../gameObjects/arrow'
import Inventory from '../../overlays/inventory'
import Settings from '../../overlays/settings'
import Help from '../../overlays/help'
import { AudioManager } from '../../utils/audioManager'

import { ArrayUtils, StringUtils } from '../../utils/utils'

export default class HeadScene extends Scene {
  public characters = {
    hellmouth: null,
    antonius: null,
    painter: null,
    buckethead: null
  }

  public interactiveObjects = {
    toBardArrow: null,
    toFishArrow: null,
    seaClickBox: null
  }

  stateManagers: { [name: string]: SceneStateManager<HeadScene> } = {
    head: new SceneStateManager<HeadScene>(this, [
      Introduction,
      Silent,
      FishHintAvailable,
      Suction,
      TheEnd
    ], [
      IntroductionSpeech,
      FishHintSpeech,
      Credits
    ]),
    water: new SceneStateManager<HeadScene>(this, [
      WaterActive,
      WaterPassive
    ], [
      WaterLooksSalty,
      ScoopingWater
    ]),
    painter: new SceneStateManager<HeadScene>(this, [
      PainterBeforeIntro,
      PainterIsAnnoyed,
      PainterIsComplaining,
      PainterNeedsColor,
      PainterIsDoneWithPainting
    ], [
      PainterComplains,
      PainterAsksForColor,
      PainterPaints
    ]),
    buckethead: new SceneStateManager<HeadScene>(this, [
      BucketheadDingDingDing,
      BucketheadIsAnnoying,
      BucketheadIsStealthy
    ], [
      BucketheadAsksForHelp,
      BucketheadGetsAHat
    ])
  }

  constructor(game: Phaser.Game) {
    super(
      game,
      Spritesheets.backgroundsBG01.key,
      Audio.soundscapesScene5.key,
      Audio.musicHead.key,
      Json.dialogsHead.key
    )
  }

  public create() {
    super.create()
    this.backgroundImage.animations.add('default', [0, 1], 0.5, true)
    this.backgroundImage.animations.play('default')
  }

  protected registerConditionalStateTransitions(scenes: { [title: string]: Scene }) {
    this.stateManagers.head.registerConditionalTransitions(
      new ConditionalStateTransition(
        Silent,
        TransitionCondition.reachedState(scenes.fish.stateManagers.fish, FishDead)
      ),
      new ConditionalStateTransition(
        FishHintAvailable,
        TransitionCondition.reachedState(scenes.bard.stateManagers.bard, CatInTheWay)
      ),
      new ConditionalStateTransition(
        Suction,
        TransitionCondition.reachedState(this.stateManagers.painter, PainterIsDoneWithPainting)
        // TODO: add conditions for minor parallel storylines
        // TransitionCondition.reachedState(scenes.bard.stateManagers.bard, BardGone)
        // .and(TransitionCondition.reachedState(scenes.bard.stateManagers.meckie, MeckieGone))
      )
    )

    this.stateManagers.buckethead.registerConditionalTransitions(
      new ConditionalStateTransition(
        BucketheadIsAnnoying,
        TransitionCondition.reachedState(this.stateManagers.painter, PainterIsComplaining)
      )
    )

    this.stateManagers.painter.registerConditionalTransitions(
      new ConditionalStateTransition(
        PainterIsAnnoyed,
        TransitionCondition.reachedState(this.stateManagers.head, Silent)
      ),
      new ConditionalStateTransition(
        PainterNeedsColor,
        TransitionCondition.reachedState(this.stateManagers.buckethead, BucketheadIsStealthy)
      )
    )
  }

  protected createGameObjects() {
    const seaClickBox = this.interactiveObjects.seaClickBox = new gameObject(this.game, 0, 169, Images.water.key)
    seaClickBox.alpha = 0
    this.game.add.existing(seaClickBox)

    // Add hellmouth
    const hellmouth = this.characters.hellmouth = new HellmouthCharacter(this, 127, 43)
    this.game.add.existing(hellmouth)

    // Add antonius
    const antonius = this.characters.antonius = new AntoniusCharacter(this, 258, 120)
    antonius.scale.setTo(2)
    this.game.add.existing(antonius)

    const painter = this.characters.painter = new PainterCharacter(this, 165, 56)
    // painter.scale.setTo(1)
    this.game.add.existing(painter)

    const bucket = this.characters.buckethead = new BucketheadCharacter(this, 191, 51)
    // bucket.scale.setTo(1)
    this.game.add.existing(bucket)

    const offsets = [
      0, 0, 10, 10, 10, 10, 11, 11, 11, 11, 9, 9, 9, 0, 0, -1, -1
    ]
    hellmouth.currentFrame.onValueChanged
      .map(frame => offsets[frame - 4] || 0)
      .add(offset => {
        painter.y = 56 - offset
        bucket.y = 51 - offset
      })

    // Add navigation arrows
    const arrow = this.interactiveObjects.toBardArrow = new Arrow(this.game, 300, 95)
    arrow.interactionEnabled = true
    this.game.add.existing(arrow)
    arrow.events.onInputUp.addOnce(() => {
      arrow.interactionEnabled = false
      this.fadeTo('bard')
    })
    const arrow2 = this.interactiveObjects.toFishArrow = new Arrow(this.game, 240, 200)
    arrow2.rotation = Math.PI / 2
    arrow2.interactionEnabled = true
    this.game.add.existing(arrow2)
    arrow2.events.onInputUp.addOnce(() => {
      arrow2.interactionEnabled = false
      this.fadeTo('fish')
    })
  }
}

// ---------------------------------------------------------------------------
// Water States
// ---------------------------------------------------------------------------

class WaterActive extends SceneState<HeadScene> {
  public async show() {
    const sea = this.scene.interactiveObjects.seaClickBox

    sea.interactionEnabled = true

    this.listeners.push(this.scene.addItemDropHandler(sea, async (key) => {
      if (key !== Images.cupEmpty.key) return false
      this.stateManager.trigger(ScoopingWater)
      return true
    }))

    this.listeners.push(sea.events.onInputUp.addOnce(
      () => this.stateManager.trigger(WaterLooksSalty)
    ))
  }
}

class WaterLooksSalty extends SceneStateTransition<HeadScene> {
  public async enter() {
    this.scene.playDialogJson('waterLooksSalty')

    return WaterActive
  }
}

class ScoopingWater extends SceneStateTransition<HeadScene> {
  public async enter() {
    Inventory.instance.takeItem(Images.cupEmpty.key)

    AudioManager.instance.tracks.speech.addClip(Audio.scoopingWater.key)
    Inventory.instance.addItem(Images.cupWater.key)

    return WaterPassive
  }
}

class WaterPassive extends SceneState<HeadScene> {
  public async show() {
    this.scene.interactiveObjects.seaClickBox.interactionEnabled = false
    this.scene.interactiveObjects.seaClickBox.visible = false
  }
}

// ---------------------------------------------------------------------------
// Hellmouth States
// ---------------------------------------------------------------------------

export class Introduction extends SceneState<HeadScene> {
  public async show() {
    this.scene.allInteractiveObjects.forEach(obj => obj.visible = false)

    this.scene.characters.hellmouth.interactionEnabled = true
    this.listeners.push(this.scene.characters.hellmouth.events.onInputDown.addOnce(
      () => this.scene.stateManagers.head.trigger(IntroductionSpeech)
    ))

    this.scene.wait(1).then(() => this.stateManager.trigger(Credits))
  }
}

class IntroductionSpeech extends SceneStateTransition<HeadScene> {
  public async enter(visible: boolean) {
    if (visible) {
      const scene = this.scene

      scene.allInteractiveObjects.forEach(obj => obj.visible = false)

      await scene.playDialogJson('headIntro')
    }
    return Silent
  }
}

export class Silent extends SceneState<HeadScene> {
  public async show() {
    this.scene.allInteractiveObjects.forEach(obj => obj.visible = true)
  }
}

export class FishHintAvailable extends SceneState<HeadScene> {
  public async show() {
    this.scene.allInteractiveObjects.forEach(obj => obj.visible = true)
    this.scene.characters.hellmouth.interactionEnabled = true
    this.listeners.push(this.scene.characters.hellmouth.events.onInputUp.addOnce(
      () => this.scene.stateManagers.head.trigger(FishHintSpeech)
    ))
  }
}

class FishHintSpeech extends SceneStateTransition<HeadScene> {
  public async enter(visible: boolean) {
    if (visible) {
      const scene = this.scene
      await scene.playDialogJson('fishHint')
    }
    return FishHintAvailable
  }
}

// ---------------------------------------------------------------------------
// Painter States
// ---------------------------------------------------------------------------

class PainterBeforeIntro extends SceneState<HeadScene> {
  public async show() {
    const scene = this.scene
    scene.characters.painter.interactionEnabled = false
  }
}

class PainterIsAnnoyed extends SceneState<HeadScene> {
  public async show() {
    const scene = this.scene

    scene.characters.painter.interactionEnabled = true
    this.listeners.push(scene.characters.painter.events.onInputUp.add(
      () => this.stateManager.trigger(PainterComplains)
    ))
  }
}

class PainterComplains extends SceneStateTransition<HeadScene> {
  public async enter() {
    const scene = this.scene

    await scene.playDialogJson('painterComplains')

    return PainterIsComplaining
  }
}

class PainterIsComplaining extends SceneState<HeadScene> {
  public async show() {
    const scene = this.scene

    scene.characters.painter.interactionEnabled = true
    this.listeners.push(scene.characters.painter.events.onInputUp.add(
      () => this.stateManager.trigger(PainterComplains)
    ))
  }
}

class PainterNeedsColor extends SceneState<HeadScene> {
  public async show() {
    const scene = this.scene

    scene.characters.painter.interactionEnabled = true
    this.listeners.push(scene.characters.painter.events.onInputUp.add(
      () => this.stateManager.trigger(PainterAsksForColor)
    ))

    this.listeners.push(scene.addItemDropHandler(scene.characters.painter, async (key) => {
      if (key !== Images.colour.key) return false
      this.stateManager.trigger(PainterPaints)
      return true
    }))
  }
}

class PainterAsksForColor extends SceneStateTransition<HeadScene> {
  public async enter() {
    const scene = this.scene

    await scene.playDialogJson('painterAsksForColor')

    return PainterNeedsColor
  }
}

class PainterPaints extends SceneStateTransition<HeadScene> {
  public async enter() {
    const scene = this.scene

    Inventory.instance.takeItem(Images.colour.key)

    await scene.playDialogJson('painterBeforePainting')

    await scene.characters.painter.setActiveState('painting')
    await scene.wait(1)
    await scene.playDialogJson('painterPaintingStage1')
    await scene.characters.painter.setActiveState('painting')
    await scene.wait(1)
    await scene.playDialogJson('painterPaintingStage2')
    await scene.characters.painter.setActiveState('painting')
    await scene.wait(1)
    await scene.playDialogJson('painterPaintingStage3')

    return PainterIsDoneWithPainting
  }
}

class PainterIsDoneWithPainting extends SceneState<HeadScene> {
  public async show() {
    // TODO: display the picture in big
  }
}

// ---------------------------------------------------------------------------
// Buckethead States
// ---------------------------------------------------------------------------

class BucketheadDingDingDing extends SceneState<HeadScene> {
  public async show() { }
}

class BucketheadIsAnnoying extends SceneState<HeadScene> {
  public async show() {
    const scene = this.scene

    scene.characters.buckethead.interactionEnabled = true
    this.listeners.push(scene.characters.buckethead.events.onInputUp.add(
      () => this.stateManager.trigger(BucketheadAsksForHelp)
    ))

    this.listeners.push(scene.addItemDropHandler(scene.characters.buckethead, async (key) => {
      if (key !== Images.hat.key) return false
      this.stateManager.trigger(BucketheadGetsAHat)
      return true
    }))
  }
}

class BucketheadAsksForHelp extends SceneStateTransition<HeadScene> {
  public async enter() {
    const scene = this.scene

    await scene.playDialogJson('bucketheadAsksForHelp')

    return BucketheadIsAnnoying
  }
}

class BucketheadGetsAHat extends SceneStateTransition<HeadScene> {
  public async enter() {
    const scene = this.scene

    await scene.playDialogJson('antoniusBringsHat')
    Inventory.instance.takeItem(Images.hat.key)
    await scene.playDialogJson('bucketheadTakesHat')
    Inventory.instance.addItem(Images.bucket.key)

    return BucketheadIsStealthy
  }
}

export class BucketheadIsStealthy extends SceneState<HeadScene> {
  public async show() {
    this.scene.characters.buckethead.setActiveState('idleHat')
  }
}

// ---------------------------------------------------------------------------
// Credits States
// ---------------------------------------------------------------------------

export class Suction extends SceneState<HeadScene> {
  public async show() {
    this.scene.allInteractiveObjects.forEach(obj => obj.visible = false)
    this.stateManager.trigger(Credits)
  }
}

class Credits extends SceneStateTransition<HeadScene> {
  private async swallowCharacters() {
    const scene = this.scene

    const swallow = async (characters: Character[] | Character, anchorY: number, walkStartY = 170, idleState = 'idle') => {
      let chars = characters instanceof Character ? [characters] : characters

      await Promise.all(chars.map(async character => {
        // Flip  + scale characters
        character.scale.x *= -2
        character.scale.y *= 2

        // Center the character's anchor
        character.anchor.setTo(0.5, anchorY)

        // Place character just right of the frame
        character.x = scene.game.width + character.anchor.x * character.width * character.scale.x
        character.y = walkStartY

        await character.setActiveState('walking')
        scene.add.existing(character)

        // Move the character in front of the mouth
        await scene.tweens.create(character).to({
          x: 190,
          y: 143
        }, 3000).start().onComplete.asPromise()
        await character.setActiveState(idleState)
      }))

      scene.characters.hellmouth.setActiveState('open mouth')
      AudioManager.instance.tracks.speech.playClip(Audio.hellmouthWhirlwind001.key)

      await Promise.all(chars.map(async character => {
        await Promise.all([
          scene.tweens.create(character).to({ rotation: Math.PI * 10 }, 5000, Phaser.Easing.Cubic.In, true).onComplete.asPromise(),
          scene.tweens.create(character.scale).to({ x: 0, y: 0}, 5000, Phaser.Easing.Cubic.In, true).onComplete.asPromise()
        ])
      }))

      await scene.characters.hellmouth.setActiveState('close mouth')
    }

    await swallow(new MeckieCharacter(scene, 0, 0), 0.3)
    await swallow(new CatCharacter(scene, 0, 0), 0)
    const bard = new BardCharacter(scene, 0, 0)
    bard.anchor.setTo(0, 0)
    bard.scale.x *= -1
    await swallow([
      new GooseCharacter(scene, 0, 0),
      bard
    ], 0.4, 150)
    await swallow(new Cook1Character(scene, 0, 0), 0)
    const cook1 = new Cook2Character(scene, 0, 0)
    cook1.scale.x *= -1
    await swallow(cook1, 0)
    const woman = new WomanCharacter(scene, 0, 0)
    woman.scale.x *= -1
    await swallow(woman, 0)
    await swallow(new AlphapigCharacter(scene, 0, 0), 0)
    const nailgoose = new NailgooseCharacter(scene, 0, 0)
    nailgoose.scale.x *= -1
    await swallow(nailgoose, 0)
    const swan = new SwanCharacter(scene, 0, 0)
    swan.scale.x *= -1
    await swallow(swan, 0, 170, 'talking')
    await swallow(new FightCloudCharacter(scene, 0, 0), 0.4, 160)

    await Promise.all([
      scene.characters.buckethead.setActiveState('vanish'),
      scene.characters.painter.setActiveState('vanish')
    ])
    await scene.characters.hellmouth.setActiveState('close forehead')
  }

  private async showCreditSegment(lines: string[], align: string = 'left') {
    const textStyle = {
      font: `8px ${CustomWebFonts.pixelOperator8Bold.family}`,
      fill: '#fff',
      stroke: '#000',
      strokeThickness: 2
    }

    const labels = lines.map(line => new Phaser.Text(this.scene.game, 0, 0, line, textStyle))
    const totalHeight = labels.reduce((h, l) => h + l.height, 0)

    let previousLabel = null
    for (const label of labels) {
      if (!previousLabel) {
        label.position.setTo(
          align === 'left' ? 5 : align === 'right' ? this.scene.game.width - 5 - label.width : (this.scene.game.width - label.width) / 2,
          (this.scene.game.height - totalHeight) / 2
        )
      } else {
        label.position.setTo(
          align === 'left' ? 10 : align === 'right' ? this.scene.game.width - 10 - label.width : (this.scene.game.width - label.width) / 2,
          previousLabel.position.y + previousLabel.height
        )
      }
      if (align === 'center' && label.width % 2 === 1) {
        label.position.x -= 0.5
      }
      label.alpha = 0
      previousLabel = label
    }

    labels.forEach(label => this.scene.add.existing(label))

    await Promise.all(labels.map(label => {
      const fadeIn = this.scene.game.tweens.create(label)
        .to({ alpha: 1 }, 1000, Phaser.Easing.Quadratic.Out, true)
      return fadeIn.onComplete.asPromise()
    }))

    await this.scene.wait(6)

    await Promise.all(labels.map(label => {
      const fadeIn = this.scene.game.tweens.create(label)
        .to({ alpha: 0 }, 1000, Phaser.Easing.Quadratic.In, true)
      return fadeIn.onComplete.asPromise()
    }))

    labels.forEach(label => label.destroy())
  }

  private async rollCredits() {
    const textStyle = {
      font: `8px ${CustomWebFonts.pixelOperator8Bold.family}`,
      fill: '#fff',
      stroke: '#000',
      strokeThickness: 2
    }

    const jonas = 'Jonas Auer'
    const nabil = 'Nabil Afnan-Samandari'
    const kay = 'Kay Fleck'
    const mathilde = 'Mathilde Hoffmann'
    const valentin = 'Valentin Spadt'
    const marina = 'Marina Strohm'

    await this.showCreditSegment(['STORY UND DIALOG', jonas, nabil, mathilde, valentin, marina])
    await this.showCreditSegment(['PROGRAMMIERUNG', jonas, valentin], 'right')
    await this.showCreditSegment(['ANIMATION', nabil, kay, mathilde])
    await this.showCreditSegment(['HINTERGRÜNDE', kay, marina], 'right')
    await this.showCreditSegment(['SPRITES', marina, mathilde, nabil, kay])
    await this.showCreditSegment(['MUSIK UND SOUND DESIGN', mathilde], 'right')
    await this.showCreditSegment(['VOICE ACTING', nabil, 'Felix Barbarino', mathilde, valentin])
    await this.showCreditSegment(['MENTORIN', 'Greta Hoffmann'], 'right')

    await this.showCreditSegment(['IN KOOPERATION MIT DER', 'STAATLICHEN KUNSTHALLE KARLSRUHE', 'Tabea Mernberger', 'Sandra Trevisan'])

    await this.showCreditSegment(['EIN SPIEL IM RAHMEN DES', 'CODE FOR CULTURE GAME JAMS'], 'right')

    await this.showCreditSegment(['VON STUDIERENDEN DER HOCHSCHULEN',
      'Universität Stuttgart',
      'Hochschule der Medien Stuttgart',
      'Eberhard Karls Universität Tübingen',
      'Staatliche Hochschule für Musik Trossingen',
      'Staatliche Hochschule für Gestaltung Karlsruhe'
    ], 'center')

    // TODO: fade to black (or original image?)
    await this.showCreditSegment(['SPEZIELLEN DANK AN',
      'Yasi Schneidt',
      'Die Organisatoren des Game Jams',
      'Staatliche Kunsthalle Karlsruhe',
      'Gamelab Karlsruhe',
      'Shackspace Stuttgart',
      'Die Schülerinnen und Schüler beim Test-Nachmittag',
      'Joos van Craesbeeck',
      'Den heiligen Antonius'
    ], 'center')
  }

  public async enter(visible: boolean) {
    this.scene.allInteractiveObjects.forEach(obj => obj.visible = false)

    if (visible) {
      const scene = this.scene

      // Hide all overlays and UI buttons
      ; [
        Settings.instance, scene.settingsButton,
        Inventory.instance, scene.inventoryButton,
        Help.instance, scene.helpButton
      ].forEach(thing => thing.visible = false)

      await Promise.all([
        this.swallowCharacters(),
        this.rollCredits()
      ])

      return TheEnd
    }
  }
}

export class TheEnd extends SceneState<HeadScene> {
  public async show() {
    this.scene.allInteractiveObjects.forEach(obj => obj.visible = false)
    this.scene.fadeTo('end')
  }
}
