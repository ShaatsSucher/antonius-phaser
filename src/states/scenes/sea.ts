import Scene from './scene'
import { SceneStateManager, SceneState, SceneStateTransition } from '../../utils/stateManager'

import { Images, Audio } from '../../assets'

import AntoniusCharacter from '../../characters/antonius'

import Arrow from '../../gameObjects/arrow'
import gameObject from '../../gameObjects/gameObject'

import Inventory from '../../overlays/inventory'

export default class SeaScene extends Scene {
  public characters = {
    antonius: null
  }

  public interactiveObjects = {
    toHeadArrow: null,
    seaClickBox: null
  }

  stateManagers = {
    default: new SceneStateManager<SeaScene>(this, [
      Initial
    ], [

    ])
  }

  constructor(game: Phaser.Game) {
    super(
      game,
      Images.backgroundsBackgroundAussichtUntenVersion2.key,
      Audio.soundscapesScene9.key // TODO: replace with correct soundscape
    )
  }

  protected createGameObjects() {
    const toHeadArrow = this.interactiveObjects.toHeadArrow = new Arrow(this.game, 364, 108)
    toHeadArrow.interactionEnabled = true
    this.game.add.existing(toHeadArrow)
    toHeadArrow.events.onInputDown.addOnce(() => {
      toHeadArrow.interactionEnabled = false
      this.fadeTo('head')
    })

    const antonius = this.characters.antonius = new AntoniusCharacter(this, 300, 100)
    antonius.scale = new Phaser.Point(3, 3)
    this.game.add.existing(antonius)

    const seaClickBox = this.interactiveObjects.seaClickBox = new gameObject(this.game, 10, 100, Images.water.key)
    seaClickBox.scale = new Phaser.Point(3, 3)
    seaClickBox.interactionEnabled = true
    seaClickBox.input.pixelPerfectOver = false
    seaClickBox.input.pixelPerfectClick = false
    this.game.add.existing(seaClickBox)
    seaClickBox.events.onInputUp.add(() => {
      if (Inventory.instance.hasItem(Images.cupEmpty.key)) {
        Inventory.instance.takeItem(Images.cupEmpty.key)
        Inventory.instance.addItem(Images.cupWater.key)
      }
    })

    // TODO: add ships

  }
}

class Initial extends SceneState<SeaScene> {
  public async show() {
    const scene = this.scene


    scene.interactiveObjects.seaClickBox.input.pixelPerfectOver = false
    scene.interactiveObjects.seaClickBox.input.pixelPerfectClick = false

  }
}
