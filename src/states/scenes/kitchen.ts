import Scene from './scene'
import { SceneStateManager, SceneState, SceneStateTransition } from '../../utils/stateManager'

import { Images, Audio } from '../../assets'

import AntoniusCharacter from '../../characters/antonius'
import EggWomanCharacter from '../../characters/eggwoman'
import Cook1Character from '../../characters/cook1'
import Cook2Character from '../../characters/cook2'
import Arrow from '../../gameObjects/arrow'

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

  stateManagers = {
    default: new SceneStateManager<KitchenScene>(this, [
      Initial
    ], [

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

    const antonius = this.characters.antonius = new AntoniusCharacter(this.game, 270, 120)
    antonius.scale = new Phaser.Point(3, 3)
    antonius.setActiveState('idle')
    this.game.add.existing(antonius)

    const eggwoman = this.characters.eggwoman = new EggWomanCharacter(this.game, 200, 100)
    eggwoman.scale = new Phaser.Point(3, 3)
    this.game.add.existing(eggwoman)

    const cook1 = this.characters.cook1 = new Cook1Character(this.game, 100, 100)
    cook1.scale = new Phaser.Point(2, 2)
    this.game.add.existing(cook1)

    const cook2 = this.characters.cook2 = new Cook2Character(this.game, 130, 100)
    cook2.scale = new Phaser.Point(2, 2)
    this.game.add.existing(cook2)
  }
}

class Initial extends SceneState<KitchenScene> {
  public async show() {
    const scene = this.scene

  }
}
