import Scene from './scene'
import { SceneStateManager, SceneState, SceneStateTransition } from '../../utils/stateManager'

import { Images, Audio } from '../../assets'

import AntoniusCharacter from '../../characters/antonius'
import OwlCharacter from '../../characters/owl'

import Arrow from '../../gameObjects/arrow'

import Inventory from '../../overlays/inventory'

export default class CanopyScene extends Scene {
  public characters = {
    antonius: null,
    owl: null
  }

  public interactiveObjects = {
    toTreeArrow: null,
    toForeheadArrow: null
  }

  stateManagers = {
    default: new SceneStateManager<CanopyScene>(this, [
      Initial
    ], [

    ])
  }

  constructor(game: Phaser.Game) {
    super(
      game,
      Images.backgroundsBackgroundTree.key, // TODO: replace with correct backgroundsHead
      Audio.soundscapesScene3.key
    )
  }

  protected createGameObjects() {
    const toTreeArrow = this.interactiveObjects.toTreeArrow = new Arrow(this.game, 190, 200)
    toTreeArrow.rotation = Math.PI / 2
    toTreeArrow.interactionEnabled = true
    this.game.add.existing(toTreeArrow)
    toTreeArrow.events.onInputDown.addOnce(() => {
      toTreeArrow.interactionEnabled = false
      this.fadeTo('tree')
    })

    const toForeheadArrow = this.interactiveObjects.toForeheadArrow = new Arrow(this.game, 20, 108)
    toForeheadArrow.rotation = Math.PI
    toForeheadArrow.interactionEnabled = true
    this.game.add.existing(toForeheadArrow)
    toForeheadArrow.events.onInputDown.addOnce(() => {
      toForeheadArrow.interactionEnabled = false
      this.fadeTo('forehead')
    })

    const antonius = this.characters.antonius = new AntoniusCharacter(this.game, 100, 100)
    antonius.scale = new Phaser.Point(3, 3)
    this.game.add.existing(antonius)

    const owl = this.characters.owl = new OwlCharacter(this.game, 150, 100)
    owl.scale = new Phaser.Point(3, 3)
    this.game.add.existing(owl)
  }

}

class Initial extends SceneState<CanopyScene> {
  public async show() {
    const scene = this.scene

  }
}
