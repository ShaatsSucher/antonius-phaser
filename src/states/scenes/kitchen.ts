import Scene from './scene'
import { SceneStateManager, SceneState, SceneStateTransition } from '../../utils/stateManager'

import { Images, Audio } from '../../assets'

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
    ])
  }

  constructor(game: Phaser.Game) {
    super(
      game,
      Images.backgroundsBackgroundChef.key,
      Audio.soundscapesScene10.key
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

    const antonius = this.characters.antonius = new AntoniusCharacter(this, 270, 120)
    antonius.scale = new Phaser.Point(3, 3)
    antonius.setActiveState('idle')
    this.game.add.existing(antonius)

    const eggwoman = this.characters.eggwoman = new EggWomanCharacter(this, 200, 100)
    eggwoman.scale = new Phaser.Point(3, 3)
    this.game.add.existing(eggwoman)

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

    await scene.characters.antonius.speech.say('Ähhh ... Hallo', null, 'lss')
    await scene.characters.cook1.speech.say('Was will den der da von uns?', 4)
    await scene.characters.cook2.speech.say('Frag ihn doch', 2)
    await scene.characters.cook1.speech.say('Frag du ihn doch', 3)
    await scene.characters.antonius.speech.say('Kann ich euch irgendwie helfen?', null, 'sssls')
    await scene.characters.cook2.speech.say('Wir brauchen noch Wasser fuer unsere Suppe', 6)
    await scene.characters.cook1.speech.say('Wolltest du das nicht holen?', 5)
    await scene.characters.cook2.speech.say('Nein. Mein Bein ist verrenkt', 5)
    await scene.characters.cook1.speech.say('Stimmt, mein bein ist ja auch\naeh verrenkt', 6)
    await scene.characters.antonius.speech.say('Ich kuemmere mich darum', null, 'slss')

    return WaitingForWater
  }
}

export class WaitingForWater extends SceneState<KitchenScene> {
  public async show() {
    const c = this.scene.characters
    
    c.cook1.interactionEnabled = true
    c.cook2.interactionEnabled = true

    // Inventory.instance.addItem(Images.cupWater.key)

    this.listeners.push(c.cook1.events.onInputUp.addOnce(() => {
      if (Inventory.instance.hasItem(Images.cupWater.key)) {
        this.stateManager.trigger(WeNeedFish)
        Inventory.instance.takeItem(Images.cupWater.key)
      } else {
        this.stateManager.trigger(StillNeedWater)
      }
    }))
    this.listeners.push(c.cook2.events.onInputUp.addOnce(() => {
      if (Inventory.instance.hasItem(Images.cupWater.key)) {
        this.stateManager.trigger(WeNeedFish)
        Inventory.instance.takeItem(Images.cupWater.key)
      } else {
        this.stateManager.trigger(StillNeedWater)
      }
    }))
  }
}

class StillNeedWater extends SceneStateTransition<KitchenScene> {
  async enter() {
    const c = this.scene.characters

    await c.cook2.speech.say('Ach, meine Beine\nquaelen mich so sehr', 5)
    await c.cook1.speech.say('Mich auch', 2)

    return WaitingForWater
  }
}

class WeNeedFish extends SceneStateTransition<KitchenScene> {
  async enter() {
    const c = this.scene.characters

    await c.antonius.speech.say('Ich habe hier etwas Wasser.\nWollt ihr das haben', null, 'ssslsss')
    await c.cook1.speech.say('Ja, das sollte reichen', 4)
    await c.cook2.speech.say('Aber fuer die Suppe brauchen wir noch Fisch', 5)
    await c.antonius.speech.say('Fisch? Kein Problem', null, 'lss')

    return WaitingForFish
  }
}

export class WaitingForFish extends SceneState<KitchenScene> {
  public async show() {
    const c = this.scene.characters

    c.cook1.interactionEnabled = true
    c.cook2.interactionEnabled = true

    // Inventory.instance.addItem(Images.filet.key)

    this.listeners.push(c.cook1.events.onInputUp.addOnce(() => {
      if (Inventory.instance.hasItem(Images.filet.key)) {
        this.stateManager.trigger(WeNeedVeggies)
        Inventory.instance.takeItem(Images.filet.key)
      } else {
        this.stateManager.trigger(StillNeedFish)
      }
    }))
    this.listeners.push(c.cook2.events.onInputUp.addOnce(() => {
      if (Inventory.instance.hasItem(Images.filet.key)) {
        this.stateManager.trigger(WeNeedVeggies)
        Inventory.instance.takeItem(Images.filet.key)
      } else {
        this.stateManager.trigger(StillNeedFish)
      }
    }))
  }
}

class StillNeedFish extends SceneStateTransition<KitchenScene> {
  async enter() {
    const c = this.scene.characters

    await c.cook2.speech.say('Ach, meine Beine\nquaelen mich so sehr', 5)
    await c.cook1.speech.say('Mich auch', 2)

    return WaitingForFish
  }
}

class WeNeedVeggies extends SceneStateTransition<KitchenScene> {
  async enter() {
    const c = this.scene.characters

    await c.cook1.speech.say('Jetzt fehlt nur noch Gemuese', 4)
    await c.cook2.speech.say('Waere mein Bein nicht so verrenkt,\nwuerde ich sofort welches holen', 7)
    await c.antonius.speech.say('Schon unterwegs', null, 'ls')

    return WaitingForVeggies
  }
}

export class WaitingForVeggies extends SceneState<KitchenScene> {
  async show() {
    const c = this.scene.characters

    c.cook1.interactionEnabled = true
    c.cook2.interactionEnabled = true

    // Inventory.instance.addItem(Images.slicedVeggies.key)

    this.listeners.push(c.cook1.events.onInputUp.addOnce(() => {
      if (Inventory.instance.hasItem(Images.slicedVeggies.key)) {
        this.stateManager.trigger(FinishCooking)
        Inventory.instance.takeItem(Images.slicedVeggies.key)
      } else if (Inventory.instance.hasItem(Images.veggies.key)) {
        this.stateManager.trigger(VeggiesNotCut)
      } else {
        this.stateManager.trigger(StillNeedFish)
      }
    }))
    this.listeners.push(c.cook2.events.onInputUp.addOnce(() => {
      if (Inventory.instance.hasItem(Images.slicedVeggies.key)) {
        this.stateManager.trigger(FinishCooking)
        Inventory.instance.takeItem(Images.slicedVeggies.key)
      } else if (Inventory.instance.hasItem(Images.veggies.key)) {
        this.stateManager.trigger(VeggiesNotCut)
      } else {
        this.stateManager.trigger(StillNeedFish)
      }
    }))
  }
}

class StillNeedVeggies extends SceneStateTransition<KitchenScene> {
  async enter() {
    const c = this.scene.characters

    await c.cook2.speech.say('Ach, meine Beine\nquaelen mich so sehr', 5)
    await c.cook1.speech.say('Mich auch', 2)

    return WaitingForVeggies
  }
}

class VeggiesNotCut extends SceneStateTransition<KitchenScene> {
  async enter() {
    const c = this.scene.characters

    await c.cook1.speech.say('Das ist ja noch gar nicht geschnitten!', 5)
    await c.cook2.speech.say('Damit koennen wir keine Suppe machen', 5)

    return WaitingForVeggies
  }
}

class FinishCooking extends SceneStateTransition<KitchenScene> {
  async enter() {
    const c = this.scene.characters

    await c.antonius.speech.say('Fehlt sonst noch etwas?', null, 'ssl')
    await c.cook1.speech.say('Toll gemacht, Bruder', 3)
    await c.cook2.speech.say('Sehr gute Zutaten die wir da gesammelt haben', 5)
    await c.cook1.speech.say('Wir koenne stolz auf uns sein', 4)
    await c.antonius.speech.say('Na dann guen Appetit!', null, 'lsss')

    c.cook1.scale.x = -3
    c.cook1.setActiveState('walking')
    c.cook2.setActiveState('walking')

    const xmin = -Math.abs(c.cook1.width * c.cook1.anchor.x)
    await Promise.all([
      this.scene.tweens.create(c.cook1).to({x: xmin}, 3000).start().onComplete.asPromise(),
      this.scene.tweens.create(c.cook2).to({x: xmin}, 3000).start().onComplete.asPromise()
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
