import Scene from './scene'
import { SceneStateManager, SceneState, SceneStateTransition } from '../../utils/stateManager'

import { Images, Audio } from '../../assets'

import AntoniusCharacter from '../../characters/antonius'

import Arrow from '../../gameObjects/arrow'

import Inventory from '../../overlays/inventory'

export default class TreeScene extends Scene {
  public characters = {
    antonius: null
  }

  public interactiveObjects = {
    toBardArrow: null
  }

  stateManagers = {
    default: new SceneStateManager<TreeScene>(this, [
      Initial
    ], [

    ])
  }

  constructor(game: Phaser.Game) {
    super(
      game,
      Images.backgroundsWoman.key,
      Audio.soundscapesScene7.key
    )
  }

  protected createGameObjects() {
    const toBardArrow = this.interactiveObjects.toBardArrow = new Arrow(this.game, 20, 95)
    toBardArrow.rotation = Math.PI
    toBardArrow.interactionEnabled = true
    this.game.add.existing(toBardArrow)
    toBardArrow.events.onInputDown.addOnce(() => {
      toBardArrow.interactionEnabled = false
      this.fadeTo('bard')
    })

    const antonius = this.characters.antonius = new AntoniusCharacter(this.game, 100, 100)
    antonius.scale = new Phaser.Point(3, 3)
    this.game.add.existing(antonius)
  }
}

class Initial extends SceneState<TreeScene> {
  public async show() {
    const scene = this.scene
  }
}
