import Scene from './scene'
import { SceneStateManager, SceneState, SceneStateTransition } from '../../utils/stateManager'

import { Images, Audio } from '../../assets'

import AntoniusCharacter from '../../characters/antonius'
import Arrow from '../../gameObjects/arrow'

import Inventory from '../../overlays/inventory'

export default class KitchenScene extends Scene {
  public characters = {
    antonius: null,
  }

  public interactiveObjects = {
    toFishArrow: null,
    toBardArrow: null
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

    const antonius = this.characters.antonius = new AntoniusCharacter(this.game, 270, 120)
    antonius.scale = new Phaser.Point(3, 3)
    antonius.setActiveState('idle')
    this.game.add.existing(antonius)
  }
}

class Initial extends SceneState<KitchenScene> {
  public async show() {
    const scene = this.scene

  }
}
