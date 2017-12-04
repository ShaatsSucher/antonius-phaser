import Scene from './scene'
import { SceneStateManager
       , SceneState
       , SceneStateTransition
       , ConditionalStateTransition
       , TransitionCondition
       } from '../../utils/stateManager'

import { FishHintAvailable, Suction } from './head'
import { FishAlive, FishDying } from './fish'

import { Audio, Images, Spritesheets, Json } from '../../assets'

import AntoniusCharacter from '../../characters/antonius'
import BardCharacter from '../../characters/bard'
import GooseCharacter from '../../characters/goose'
import CatCharacter from '../../characters/cat'
import MeckieCharacter from '../../characters/meckie'

import { FishGone } from './fish'
import { VeggiesPickedUp } from './concert'

import Arrow from '../../gameObjects/arrow'
import GameObject from '../../gameObjects/gameObject'

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
      WaitingForFishOrVeggies,
      WaitingForFish,
      WaitingForVeggies,
      MeckieGone
    ], [
      MeckieIntroduction,
      MeckieRequest,
      CutFishFirst,
      CutVeggiesFirst,
      CutFish,
      RequestingFish,
      RequestingVeggies,
      CuttingVeggies,
      MeckieGoing
    ])
  }

  constructor(game: Phaser.Game) {
    super(game, Images.backgroundsBG02.key, Audio.soundscapesScene6.key, [], Json.dialogsBard.key)
  }

  protected createGameObjects() {
    const meckie = this.characters.meckie = new MeckieCharacter(this, 78, 120)
    meckie.scale.setTo(2)
    meckie.anchor.setTo(0.5, 0)
    meckie.setActiveState('idle')
    this.add.existing(meckie)

    const goose = this.characters.goose = new GooseCharacter(this, 200, 60)
    goose.scale.setTo(2)
    goose.anchor.setTo(0.5, 0)
    goose.setActiveState('idle')
    goose.inputEnabled = false
    this.add.existing(goose)

    const bard = this.characters.bard = new BardCharacter(this, 200, 60)
    bard.scale.setTo(2)
    bard.anchor.setTo(0.5, 0)
    bard.setActiveState('idle')
    this.add.existing(bard)

    const cat = this.characters.cat = new CatCharacter(this, 200, 96)
    cat.scale.setTo(2)
    cat.anchor.setTo(0.5, 0)
    cat.setActiveState('idle')
    this.add.existing(cat)

    const antonius = this.characters.antonius = new AntoniusCharacter(this, 292, 120)
    antonius.scale.setTo(2)
    antonius.setActiveState('idle')
    this.add.existing(antonius)

    const snail = new GameObject(this.game, 260, 160, Spritesheets.snail.key)
    snail.animations.add('idle', [0, 1], 1, true)
    snail.play('idle')
    this.game.add.existing(snail)

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
    const bard = scene.characters.bard

    bard.setActiveState('singing')
    const bardSong = AudioManager.instance.tracks.speech.addClip(Audio.bardSongShort.key)
    bardSong.stopped.then(() => { bard.setActiveState('idle') })

    const lines: [{ time: number, text: string }] = [
      { time: 0, text: 'Traurigkeit im Übermaß.' },
      { time: 4100, text: 'Auf ihrem Rücken ich doch saß.' },
      { time: 8600, text: 'Ihr Stimmchen ich zu hören wähne.' },
      { time: 13500, text: 'Sogleich entweicht mir eine Träne.' }
    ]

    let label: Phaser.Text
    const updateHandler = scene.onUpdate.add(() => {
      if (lines.length > 0 && lines[0].time <= bardSong.sound.currentTime) {
        if (label) label.kill()

        const line = lines.shift()
        label = scene.add.text(0, 0, line.text, bard.speech.textStyle)

        label.anchor.setTo(0.5, 0)

        label.alignTo(
          bard, Phaser.TOP_CENTER,
          scene.characters.bard.speech.textAnchor.x,
          scene.characters.bard.speech.textAnchor.y
        )
        if (label.width % 2 !== 0) {
          label.x = Math.floor(label.x) + 0.5
        }
      }
    })

    if (DEBUG) {
      await Promise.race([bardSong.stopped, scene.clickedAnywhere()])
      if (bardSong.sound.isPlaying) {
        bardSong.stop()
      }
    } else {
      await bardSong.stopped
    }

    updateHandler.detach()

    await scene.clickedAnywhere()
    if (label) label.kill()

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
    this.listeners.push(scene.addItemDropHandler(scene.characters.cat, async (key) => {
      if (key !== Images.filet.key) return false
      this.stateManager.trigger(CatFeast)
      return true
    }))

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

class CatFeast extends SceneStateTransition<BardScene> {
  public async enter() {
    const scene = this.scene

    await scene.playDialogJson('catFeastBeforeAccepted')

    await scene.wait(0.5)
    Inventory.instance.takeItem(Images.filet.key)
    await scene.wait(0.5)

    await scene.playDialogJson('catFeastAfterAccepted')

    scene.characters.cat.visible = false

    const catJump = new Phaser.Sprite(scene.game, 266, 60, Spritesheets.catJump.key)
    catJump.animations.add('jump', ArrayUtils.range(1, 7), 8)
    catJump.scale.setTo(-2, 2)
    scene.add.existing(catJump)
    await catJump.animations.play('jump').onComplete.asPromise()
    catJump.kill()

    scene.characters.cat.scale.x *= -1
    scene.characters.cat.setActiveState('walking')
    scene.characters.cat.position.x -= 42
    scene.characters.cat.position.y += 56
    scene.characters.cat.visible = true


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

    scene.characters.bard.scale.x *= -1
    scene.characters.bard.x = 180
    scene.characters.bard.y = 60
    await scene.wait(0.5)

    await scene.playDialogJson('catGoneAfterReversal')

    scene.characters.bard.scale.x *= -1
    scene.characters.bard.x = 204
    scene.characters.goose.scale.x *= -1
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

    return WaitingForFishOrVeggies
  }
}

export class WaitingForFishOrVeggies extends SceneState<BardScene> {
  public async show() {
    const scene = this.scene

    scene.characters.meckie.interactionEnabled = true
    this.listeners.push(scene.characters.meckie.events.onInputDown.addOnce(
      () => this.stateManager.trigger(MeckieRequest)
    ))
    this.listeners.push(scene.addItemDropHandler(scene.characters.meckie, async (key) => {
      if (key === Images.fish.key) {
        this.stateManager.trigger(CutFishFirst)
        return true
      } else if (key === Images.carrot.key) {
        this.stateManager.trigger(CutVeggiesFirst)
        return true
      }
      return false
    }))
  }
}

class CutFishFirst extends SceneStateTransition<BardScene> {
  public async enter() {
    const scene = this.scene

    await scene.playDialogJson('cutFishBeforeCutting')

    Inventory.instance.takeItem(Images.fish.key)

    scene.characters.meckie.setActiveState('swinging')
    await scene.wait(0.5)

    await scene.playDialogJson('cutFishAfterCutting')

    Inventory.instance.addItem(Images.filet.key, 2)

    await scene.playDialogJson('cutFishAfterPickup')

    return RequestingVeggies
  }
}

class CutVeggiesFirst extends SceneStateTransition<BardScene> {
  public async enter() {
    const scene = this.scene

    await scene.playDialogJson('cuttingVeggiesBeforeCutting')

    Inventory.instance.takeItem(Images.carrot.key)

    scene.characters.meckie.setActiveState('swinging')
    await scene.wait(0.5)

    Inventory.instance.addItem(Images.carrotSliced.key)

    await scene.playDialogJson('cuttingVeggiesAfterCutting')

    return RequestingFish
  }
}

class WaitingForFish extends SceneState<BardScene> {
  public async show() {
    const scene = this.scene

    scene.characters.meckie.interactionEnabled = true
    this.listeners.push(scene.characters.meckie.events.onInputDown.addOnce(
      () => this.stateManager.trigger(RequestingFish)
    ))
    this.listeners.push(scene.addItemDropHandler(scene.characters.meckie, async (key) => {
      if (key !== Images.fish.key) return false
      this.stateManager.trigger(CutFish)
      return true
    }))
  }
}

export class RequestingFish extends SceneStateTransition<BardScene> {
  public async enter() {
    const scene = this.scene

    await scene.playDialogJson('requestingBeforeSwing')

    scene.characters.meckie.setActiveState('swinging')
    await scene.wait(0.5)
    scene.characters.meckie.setActiveState('idle')

    await scene.playDialogJson('requestingAfterSwing')

    return WaitingForFish
  }
}

class CutFish extends SceneStateTransition<BardScene> {
  public async enter() {
    const scene = this.scene

    await scene.playDialogJson('cutFishBeforeCutting')

    Inventory.instance.takeItem(Images.fish.key)

    scene.characters.meckie.setActiveState('swinging')
    await scene.wait(0.5)
    scene.characters.meckie.setActiveState('idle')

    await scene.playDialogJson('cutFishAfterCutting')

    Inventory.instance.addItem(Images.filet.key, 2)

    await scene.playDialogJson('cutFishAfterPickup')

    return MeckieGoing
  }
}

class WaitingForVeggies extends SceneState<BardScene> {
  public async show() {
    const scene = this.scene

    scene.characters.meckie.interactionEnabled = true
    this.listeners.push(scene.characters.meckie.events.onInputUp.addOnce(
      () => this.stateManager.trigger(RequestingVeggies)
    ))
    this.listeners.push(scene.addItemDropHandler(scene.characters.meckie, async (key) => {
      if (key !== Images.carrot.key) return false
      this.stateManager.trigger(CuttingVeggies)
      return true
    }))
  }
}

class RequestingVeggies extends SceneStateTransition<BardScene> {
  public async enter() {
    const scene = this.scene

    await scene.playDialogJson('requestingBeforeSwing')

    scene.characters.meckie.setActiveState('swinging')
    await scene.wait(0.5)
    scene.characters.meckie.setActiveState('idle')

    await scene.playDialogJson('requestingAfterSwing')

    return WaitingForVeggies
  }
}

class CuttingVeggies extends SceneStateTransition<BardScene> {
  public async enter() {
    const scene = this.scene

    await scene.playDialogJson('cuttingVeggiesBeforeCutting')

    Inventory.instance.takeItem(Images.carrot.key)

    scene.characters.meckie.setActiveState('swinging')
    await scene.wait(0.5)

    Inventory.instance.addItem(Images.carrotSliced.key)

    await scene.playDialogJson('cuttingVeggiesAfterCutting')

    return MeckieGoing
  }
}

class MeckieGoing extends SceneStateTransition<BardScene> {
  public async enter() {
    const scene = this.scene

    await scene.playDialogJson('meckieGoing')

    scene.characters.meckie.scale.x *= -1
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
