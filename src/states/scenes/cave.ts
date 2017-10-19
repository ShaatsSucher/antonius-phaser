import Scene from './scene'
import { SceneStateManager, SceneState, SceneStateTransition } from '../../utils/stateManager'

import { Images, Audio } from '../../assets'

import AntoniusCharacter from '../../characters/antonius'

import Arrow from '../../gameObjects/arrow'
import Inventory from '../../overlays/inventory'

export default class CaveScene extends Scene {
  public characters = {
    antonius: null
  }

  public interactiveObjects = {
    toTreeArrow: null
  }

  stateManagers = {
    default: new SceneStateManager<CaveScene>(this, [
      Initial
    ], [

    ])
  }

  constructor(game: Phaser.Game) {
    super(
      game,
      Images.backgroundsBackgroundTree.key, // TODO: replace with correct background
      Audio.soundscapesScene7.key, // TODO: replace with correct soundscape
    )
  }

  protected createGameObjects() {
    const toTreeArrow = this.interactiveObjects.toTreeArrow = new Arrow(this.game, 20, 108)
    toTreeArrow.rotation = Math.PI
    toTreeArrow.interactionEnabled = true
    this.game.add.existing(toTreeArrow)
    toTreeArrow.events.onInputDown.addOnce(() => {
      toTreeArrow.interactionEnabled = false
      this.fadeTo('tree')
    })

    const antonius = this.characters.antonius = new AntoniusCharacter(this.game, 100, 100)
    antonius.scale = new Phaser.Point(-3, 3)
    this.game.add.existing(antonius)
  }
}

class Initial extends SceneState<CaveScene> {
  public async show() {
    const scene = this.scene

  }
}
