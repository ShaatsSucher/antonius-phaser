import Scene from './scene'
import { SceneStateManager,
         SceneState,
         SceneStateTransition,
         ConditionalStateTransition,
         TransitionCondition
       } from '../../utils/stateManager'

import { Audio, Images, Json } from '../../assets'

import AntoniusCharacter from '../../characters/antonius'
import EggWomanCharacter from '../../characters/eggwoman'
import Cook1Character from '../../characters/cook1'
import Cook2Character from '../../characters/cook2'
import DancingGeeseCharacter from '../../characters/dancingGeese'

import { MusiciansGone } from './concert'

import Arrow from '../../gameObjects/arrow'
import GameObject from '../../gameObjects/gameObject'

import Inventory from '../../overlays/inventory'
import { AudioManager } from '../../utils/audioManager'
import { ArrayUtils, StringUtils } from '../../utils/utils'
import SpeechHelper from '../../utils/speechHelper'

export default class KitchenScene extends Scene {
  public characters: {
    antonius: AntoniusCharacter,
    eggwoman: EggWomanCharacter,
    cook1: Cook1Character,
    cook2: Cook2Character,
    dancingGeese: DancingGeeseCharacter
  } = <any>{}

  public interactiveObjects = {
    toFishArrow: null,
    toBardArrow: null,
    toConcertArrow: null,

    bowl: null,
    rock: null
  }
  emptyBowl: GameObject

  stateManagers: {[name: string]: SceneStateManager<KitchenScene>} = {
    cooks: new SceneStateManager<KitchenScene>(this, [
      InitialCooks,
      WaitingForWater,
      WaitingForFish,
      WaitingForVeggies,
      DoneCooking,
      NoSoupLeft
    ], [
      WeNeedWater,
      StillNeedWater,
      WeNeedFish,
      StillNeedFish,
      WeNeedVeggies,
      StillNeedVeggies,
      VeggiesNotCut,
      FinishCooking,
      LeftoverSoup,
      ScoopingSoup
    ]),
    eggwoman: new SceneStateManager<KitchenScene>(this, [
      InitialEggwoman,
      EggwomanWentOver
    ], [
      KidsTheseDays
    ]),
    townmusicianNoise: new SceneStateManager(this, [
      TownMusiciansNoisy,
      TownMusiciansSilent
    ], [ ]),
    rock: new SceneStateManager(this, [
      InitialRock
    ], [
      InterestingRock
    ]),
    dancingGeese: new SceneStateManager(this, [
      DancingGeeseThere,
      DancingGeeseGone
    ], [
      DancingGeeseVanishing
    ])
  }

  constructor(game: Phaser.Game) {
    super(
      game,
      Images.backgroundsBG05.key,
      Audio.soundscapesScene10.key,
      Audio.musicHead.key,
      Json.dialogsKitchen.key
    )
  }

  protected createGameObjects() {
    // Add navigation arrows
    const toFishArrow = this.interactiveObjects.toFishArrow = new Arrow(this.game, 20, 108)
    toFishArrow.rotation = Math.PI
    toFishArrow.interactionEnabled = true
    this.game.add.existing(toFishArrow)
    toFishArrow.events.onInputDown.addOnce(() => {
      toFishArrow.interactionEnabled = false
      this.fadeTo('fish')
    })

    const toBardArrow = this.interactiveObjects.toBardArrow = new Arrow(this.game, 192, 20)
    toBardArrow.rotation = - Math.PI / 2
    toBardArrow.interactionEnabled = true
    this.game.add.existing(toBardArrow)
    toBardArrow.events.onInputDown.addOnce(() => {
      toBardArrow.interactionEnabled = false
      this.fadeTo('bard')
    })

    const toConcertArrow = this.interactiveObjects.toConcertArrow = new Arrow(this.game, 364, 108)
    toConcertArrow.interactionEnabled = true
    this.game.add.existing(toConcertArrow)
    toConcertArrow.events.onInputDown.addOnce(() => {
      toConcertArrow.interactionEnabled = false
      this.fadeTo('concert')
    })

    const rock = this.interactiveObjects.rock = new GameObject(this.game, 216, 94, Images.rock.key)
    this.game.add.existing(rock)

    this.emptyBowl = new GameObject(this.game, 43, 115, Images.bowlEmpty.key)
    this.game.add.existing(this.emptyBowl)

    const bowl = this.interactiveObjects.bowl = new GameObject(this.game, 43, 115, Images.bowl.key)
    this.game.add.existing(bowl)

    const eggwoman = this.characters.eggwoman = new EggWomanCharacter(this, 200, 100)
    eggwoman.scale.setTo(2)
    this.game.add.existing(eggwoman)

    const antonius = this.characters.antonius = new AntoniusCharacter(this, 270, 110)
    antonius.scale.setTo(2)
    antonius.setActiveState('idle')
    this.game.add.existing(antonius)

    const cook1 = this.characters.cook1 = new Cook1Character(this, 82, 96)
    cook1.anchor.x = 0.5
    cook1.scale.setTo(2)
    this.game.add.existing(cook1)

    const cook2 = this.characters.cook2 = new Cook2Character(this, 117, 110)
    cook2.anchor.x = 0.5
    cook2.scale.setTo(2)
    this.game.add.existing(cook2)

    const dancingGeese = this.characters.dancingGeese = new DancingGeeseCharacter(this, 69, 25)
    dancingGeese.scale.setTo(2)
    this.game.add.existing(dancingGeese)
  }

  protected registerConditionalStateTransitions(scenes: { [title: string]: Scene }) {
    this.stateManagers.dancingGeese.registerConditionalTransitions(
      new ConditionalStateTransition(
        DancingGeeseGone,
        TransitionCondition.reachedState(this.stateManagers.eggwoman, EggwomanWentOver)
        .and(TransitionCondition.reachedState(this.stateManagers.cooks, DoneCooking))
      )
    )
    this.stateManagers.townmusicianNoise.registerConditionalTransitions(
      new ConditionalStateTransition(
        TownMusiciansSilent,
        TransitionCondition.reachedState(scenes.concert.stateManagers.musicians, MusiciansGone)
      )
    )
  }
}

export class InitialCooks extends SceneState<KitchenScene> {
  public async show() {
    const scene = this.scene
    scene.interactiveObjects.bowl.visible = true

    scene.characters.cook1.interactionEnabled = true
    scene.characters.cook2.interactionEnabled = true

    this.listeners.push(scene.characters.cook1.events.onInputUp.addOnce(
      () => this.stateManager.trigger(WeNeedWater)
    ))

    this.listeners.push(scene.characters.cook2.events.onInputUp.addOnce(
      () => this.stateManager.trigger(WeNeedWater)
    ))
  }
}

class WeNeedWater extends SceneStateTransition<KitchenScene> {
  public async enter() {
    const scene = this.scene
    scene.interactiveObjects.bowl.visible = true

    await scene.playDialogJson('cooksNeedWater')

    return WaitingForWater
  }
}

export class WaitingForWater extends SceneState<KitchenScene> {
  public async show() {
    this.scene.interactiveObjects.bowl.visible = true
    const c = this.scene.characters

    c.cook1.interactionEnabled = true
    c.cook2.interactionEnabled = true

    // Inventory.instance.addItem(Images.cupWater.key)

    this.listeners.push(this.scene.addItemDropHandler(c.cook1, async (key) => {
      if (key !== Images.cupWater.key) return false
      this.stateManager.trigger(WeNeedFish)
      Inventory.instance.takeItem(Images.cupWater.key)
      return true
    }))
    this.listeners.push(this.scene.addItemDropHandler(c.cook2, async (key) => {
      if (key !== Images.cupWater.key) return false
      this.stateManager.trigger(WeNeedFish)
      Inventory.instance.takeItem(Images.cupWater.key)
      return true
    }))

    this.listeners.push(c.cook1.events.onInputUp.addOnce(
      () => this.stateManager.trigger(StillNeedWater)
    ))
    this.listeners.push(c.cook2.events.onInputUp.addOnce(
      () => this.stateManager.trigger(StillNeedWater)
    ))
  }
}

class StillNeedWater extends SceneStateTransition<KitchenScene> {
  async enter() {
    const scene = this.scene
    scene.interactiveObjects.bowl.visible = true

    await scene.playDialogJson('cooksWaitingForWater')

    return WaitingForWater
  }
}

class WeNeedFish extends SceneStateTransition<KitchenScene> {
  async enter() {
    const scene = this.scene
    scene.interactiveObjects.bowl.visible = true

    await scene.playDialogJson('cooksNeedFish')

    return WaitingForFish
  }
}

export class WaitingForFish extends SceneState<KitchenScene> {
  public async show() {
    this.scene.interactiveObjects.bowl.visible = true
    const c = this.scene.characters

    c.cook1.interactionEnabled = true
    c.cook2.interactionEnabled = true

    // Inventory.instance.addItem(Images.filet.key)

    this.listeners.push(this.scene.addItemDropHandler(c.cook1, async (key) => {
      if (key !== Images.filet.key) return false
      this.stateManager.trigger(WeNeedVeggies)
      Inventory.instance.takeItem(Images.filet.key)
      return true
    }))
    this.listeners.push(this.scene.addItemDropHandler(c.cook2, async (key) => {
      if (key !== Images.filet.key) return false
      this.stateManager.trigger(WeNeedVeggies)
      Inventory.instance.takeItem(Images.filet.key)
      return true
    }))

    this.listeners.push(c.cook1.events.onInputUp.addOnce(
      () => this.stateManager.trigger(StillNeedFish)
    ))
    this.listeners.push(c.cook2.events.onInputUp.addOnce(
      () => this.stateManager.trigger(StillNeedFish)
    ))
  }
}

class StillNeedFish extends SceneStateTransition<KitchenScene> {
  async enter() {
    const scene = this.scene
    scene.interactiveObjects.bowl.visible = true

    await scene.playDialogJson('cooksWaitingForFish')

    return WaitingForFish
  }
}

class WeNeedVeggies extends SceneStateTransition<KitchenScene> {
  async enter() {
    const scene = this.scene
    scene.interactiveObjects.bowl.visible = true

    await scene.playDialogJson('cooksNeedVeggies')

    return WaitingForVeggies
  }
}

export class WaitingForVeggies extends SceneState<KitchenScene> {
  async show() {
    this.scene.interactiveObjects.bowl.visible = true

    const c = this.scene.characters

    c.cook1.interactionEnabled = true
    c.cook2.interactionEnabled = true

    // Inventory.instance.addItem(Images.carrotSliced.key)

    this.listeners.push(this.scene.addItemDropHandler(c.cook1, async (key) => {
      if (key === Images.carrotSliced.key) {
        this.stateManager.trigger(FinishCooking)
        Inventory.instance.takeItem(Images.carrotSliced.key)
        return true
      } else if (key === Images.carrot.key) {
        this.stateManager.trigger(VeggiesNotCut)
        return false
      } else return false
    }))
    this.listeners.push(this.scene.addItemDropHandler(c.cook2, async (key) => {
      if (key === Images.carrotSliced.key) {
        this.stateManager.trigger(FinishCooking)
        Inventory.instance.takeItem(Images.carrotSliced.key)
        return true
      } else if (key === Images.carrot.key) {
        this.stateManager.trigger(VeggiesNotCut)
        return false
      } else return false
    }))

    this.listeners.push(c.cook1.events.onInputUp.addOnce(
      () => this.stateManager.trigger(StillNeedVeggies)
    ))
    this.listeners.push(c.cook2.events.onInputUp.addOnce(
      () => this.stateManager.trigger(StillNeedVeggies)
    ))
  }
}

class StillNeedVeggies extends SceneStateTransition<KitchenScene> {
  async enter() {
    const scene = this.scene
    scene.interactiveObjects.bowl.visible = true

    await scene.playDialogJson('cooksWaitingForVeggies')

    return WaitingForVeggies
  }
}

class VeggiesNotCut extends SceneStateTransition<KitchenScene> {
  async enter() {
    const scene = this.scene
    scene.interactiveObjects.bowl.visible = true

    await scene.playDialogJson('cooksWantVeggiesCut')

    return WaitingForVeggies
  }
}

class FinishCooking extends SceneStateTransition<KitchenScene> {
  async enter() {
    const scene = this.scene
    const c = scene.characters
    scene.interactiveObjects.bowl.visible = true

    await scene.playDialogJson('cooksCooking')

    c.cook1.scale.x *= -1
    c.cook1.setActiveState('walking')
    c.cook2.setActiveState('walking')

    const xmin = -Math.abs(c.cook1.width * c.cook1.anchor.x)
    await Promise.all([
      scene.tweens.create(c.cook1).to({x: xmin}, 3000).start().onComplete.asPromise(),
      scene.tweens.create(c.cook2).to({x: xmin}, 3000).start().onComplete.asPromise()
    ])

    return DoneCooking
  }
}

class DoneCooking extends SceneState<KitchenScene> {
  async show() {
    const c = this.scene.characters

    c.cook1.visible = false
    c.cook2.visible = false
    this.scene.interactiveObjects.bowl.visible = true

    this.scene.interactiveObjects.bowl.visible = true

    this.listeners.push(this.scene.interactiveObjects.bowl.events.onInputUp.addOnce(() =>
      this.stateManager.trigger(LeftoverSoup)
    ))

    this.listeners.push(this.scene.addItemDropHandler(this.scene.interactiveObjects.bowl, async (key) => {
      if (key !== Images.cupEmpty.key) return false
      Inventory.instance.takeItem(Images.cupEmpty.key)
      this.stateManager.trigger(ScoopingSoup)
      return true
    }))
  }
}

class LeftoverSoup extends SceneStateTransition<KitchenScene> {
  async enter() {
    this.scene.interactiveObjects.bowl.visible = true

    this.scene.characters.cook1.visible = false
    this.scene.characters.cook2.visible = false

    await this.scene.playDialogJson('leftoverSoup')
    return DoneCooking
  }
}

class ScoopingSoup extends SceneStateTransition<KitchenScene> {
  async enter() {
    this.scene.characters.cook1.visible = false
    this.scene.characters.cook2.visible = false
    this.scene.interactiveObjects.bowl.visible = false

    AudioManager.instance.tracks.speech.playClip(Audio.scoopingWater.key)
    Inventory.instance.addItem(Images.cupSoup.key)

    return NoSoupLeft
  }
}

export class NoSoupLeft extends SceneState<KitchenScene> {
  async show() {
    this.scene.characters.cook1.visible = false
    this.scene.characters.cook2.visible = false
    this.scene.interactiveObjects.bowl.visible = false

    this.scene.interactiveObjects.bowl.interactionEnabled = false
  }
}

// ---------------------------------------------------------------------------
// Eggwoman States
// ---------------------------------------------------------------------------

class InitialEggwoman extends SceneState<KitchenScene> {
  async show() {
    const eggwoman = this.scene.characters.eggwoman

    eggwoman.interactionEnabled = true

    this.listeners.push(eggwoman.events.onInputUp.addOnce(() => {
      this.stateManager.trigger(KidsTheseDays)
    }))
  }
}

class KidsTheseDays extends SceneStateTransition<KitchenScene> {
  async enter() {
    await this.scene.playDialogJson('kidsTheseDays')

    this.scene.characters.eggwoman.setActiveState('walking')
    await this.scene.tweens.create(this.scene.characters.eggwoman).to({
      x: 384
    }, 3000).start().onComplete.asPromise()

    return EggwomanWentOver
  }
}

export class EggwomanWentOver extends SceneState<KitchenScene> {
  async show() {
    const eggwoman = this.scene.characters.eggwoman

    eggwoman.visible = false
    eggwoman.interactionEnabled = false
  }
}

// ---------------------------------------------------------------------------
// Rock States
// ---------------------------------------------------------------------------

class InitialRock extends SceneState<KitchenScene> {
  async show() {
    this.scene.interactiveObjects.rock.interactionEnabled = true

    this.listeners.push(this.scene.interactiveObjects.rock.events.onInputUp.addOnce(
      () => this.stateManager.trigger(InterestingRock)
    ))
  }
}

class InterestingRock extends SceneStateTransition<KitchenScene> {
  async enter() {
    await this.scene.playDialogJson('interestingRock')

    return InitialRock
  }
}

// ---------------------------------------------------------------------------
// DancingGeese States
// ---------------------------------------------------------------------------

class DancingGeeseThere extends SceneState<KitchenScene> {
  async show() {
    this.scene.characters.dancingGeese.visible = true
  }
}

class DancingGeeseVanishing extends SceneStateTransition<KitchenScene> {
  async enter() {
    AudioManager.instance.tracks.speech.playClip(Audio.characterPlop.key)
    this.scene.characters.dancingGeese.visible = false
    return DancingGeeseGone
  }
}

class DancingGeeseGone extends SceneState<KitchenScene> {
  async show() {
    this.scene.characters.dancingGeese.visible = false
  }
}

// ---------------------------------------------------------------------------
// TownMusicianNoise States
// ---------------------------------------------------------------------------

class TownMusiciansNoisy extends SceneState<KitchenScene> {
  private readonly sampleGenerator = SpeechHelper.Generators.random(
    ArrayUtils.range(1, 14).map(i =>
      Audio[`townmusiciansDistance${StringUtils.intToString(i, 3)}`].key
    )
  )
  private visible = false

  async show() {
    this.visible = true
    const sampleGenerator = this.sampleGenerator()
    const playSound = () => {
      AudioManager.instance.tracks.atmo.playClip(sampleGenerator()).then(() => {
        if (this.visible && this.stateManager.getActiveState() === TownMusiciansNoisy) {
          this.scene.wait(0).then(() => playSound())
        }
      })
    }
    playSound()
  }

  async hide() {
    this.visible = false
  }
}

class TownMusiciansSilent extends SceneState<KitchenScene> {
  async show() { }
}
