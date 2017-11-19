import Scene from './scene'
import { SceneStateManager, SceneState, SceneStateTransition } from '../../utils/stateManager'

import { Audio, Images, Json } from '../../assets'

import AntoniusCharacter from '../../characters/antonius'
import EggWomanCharacter from '../../characters/eggwoman'
import Cook1Character from '../../characters/cook1'
import Cook2Character from '../../characters/cook2'

import Arrow from '../../gameObjects/arrow'
import GameObject from '../../gameObjects/gameObject'

import Inventory from '../../overlays/inventory'

export default class KitchenScene extends Scene {
  public characters = {
    antonius: null,
    eggwoman: null,
    cook1: null,
    cook2: null
  }

  public interactiveObjects = {
    toFishArrow: null,
    toBardArrow: null,
    toConcertArrow: null
  }

  stateManagers: {[name: string]: SceneStateManager<KitchenScene>} = {
    cooks: new SceneStateManager<KitchenScene>(this, [
      InitialCooks,
      WaitingForWater,
      WaitingForFish,
      WaitingForVeggies,
      DoneCooking
    ], [
      WeNeedWater,
      StillNeedWater,
      WeNeedFish,
      StillNeedFish,
      WeNeedVeggies,
      StillNeedVeggies,
      VeggiesNotCut,
      FinishCooking
    ]),
    eggwoman: new SceneStateManager<KitchenScene>(this, [
      InitialEggwoman,
      EggwomanWentOver
    ], [
      KidsTheseDays
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

    const eggwoman = this.characters.eggwoman = new EggWomanCharacter(this, 200, 100)
    eggwoman.scale = new Phaser.Point(3, 3)
    this.game.add.existing(eggwoman)

    const antonius = this.characters.antonius = new AntoniusCharacter(this, 270, 120)
    antonius.scale = new Phaser.Point(3, 3)
    antonius.setActiveState('idle')
    this.game.add.existing(antonius)

    const cook1 = this.characters.cook1 = new Cook1Character(this, 100, 100)
    cook1.scale = new Phaser.Point(2, 2)
    this.game.add.existing(cook1)

    const cook2 = this.characters.cook2 = new Cook2Character(this, 130, 100)
    cook2.scale = new Phaser.Point(2, 2)
    this.game.add.existing(cook2)
  }
}

export class InitialCooks extends SceneState<KitchenScene> {
  public async show() {
    const scene = this.scene

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

    await scene.playDialogJson('cooksNeedWater')

    return WaitingForWater
  }
}

export class WaitingForWater extends SceneState<KitchenScene> {
  public async show() {
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

    await scene.playDialogJson('cooksWaitingForWater')

    return WaitingForWater
  }
}

class WeNeedFish extends SceneStateTransition<KitchenScene> {
  async enter() {
    const scene = this.scene

    await scene.playDialogJson('cooksNeedFish')

    return WaitingForFish
  }
}

export class WaitingForFish extends SceneState<KitchenScene> {
  public async show() {
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

    await scene.playDialogJson('cooksWaitingForFish')

    return WaitingForFish
  }
}

class WeNeedVeggies extends SceneStateTransition<KitchenScene> {
  async enter() {
    const scene = this.scene

    await scene.playDialogJson('cooksNeedVeggies')

    return WaitingForVeggies
  }
}

export class WaitingForVeggies extends SceneState<KitchenScene> {
  async show() {
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
      () => this.stateManager.trigger(StillNeedFish)
    ))
    this.listeners.push(c.cook2.events.onInputUp.addOnce(
      () => this.stateManager.trigger(StillNeedFish)
    ))
  }
}

class StillNeedVeggies extends SceneStateTransition<KitchenScene> {
  async enter() {
    const scene = this.scene

    await scene.playDialogJson('cooksWaitingForVeggies')

    return WaitingForVeggies
  }
}

class VeggiesNotCut extends SceneStateTransition<KitchenScene> {
  async enter() {
    const scene = this.scene

    await scene.playDialogJson('cooksWantVeggiesCut')

    return WaitingForVeggies
  }
}

class FinishCooking extends SceneStateTransition<KitchenScene> {
  async enter() {
    const scene = this.scene
    const c = scene.characters

    await scene.playDialogJson('cooksCooking')

    c.cook1.scale.x *= -1
    c.cook1.setActiveState('walking')
    c.cook2.setActiveState('walking')

    const xmin = -Math.abs(c.cook1.width * c.cook1.anchor.x)
    await Promise.all([
      scene.tweens.create(c.cook1).to({x: xmin}, 3000).start().onComplete.asPromise(),
      scene.tweens.create(c.cook2).to({x: xmin}, 3000).start().onComplete.asPromise()
    ])

    // TODO: make it so you have to click the soup pot, to obtain soup
    Inventory.instance.addItem(Images.cupSoup.key)

    return DoneCooking
  }
}

export class DoneCooking extends SceneState<KitchenScene> {
  async show() {
    const c = this.scene.characters

    c.cook1.visible = false
    c.cook2.visible = false
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
