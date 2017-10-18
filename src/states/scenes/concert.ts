import Scene from './scene'
import { SceneStateManager, SceneState, SceneStateTransition } from '../../utils/stateManager'

import { Images, Audio } from '../../assets'

import AntoniusCharacter from '../../characters/antonius'

import Arrow from '../../gameObjects/arrow'

import Inventory from '../../overlays/inventory'


export default class ConcertScene extends Scene {
  public characters = {
    antonius: null
  }

  public interactiveObjects = {
    toKitchenArrow: null,
    toTreeArrow: null
  }

  stateManagers = {
    default: new SceneStateManager<ConcertScene>(this, [
      Initial
    ], [

    ])
  }

  constructor(game: Phaser.Game) {
    super(
      game,
      Images.backgroundsBackgroundBremerStadtmusikanten.key,
      Audio.soundscapesScene3.key // TODO: replace with correct soundscape
    )
  }

  protected createGameObjects() {
    const toKitchenArrow = this.interactiveObjects.toKitchenArrow = new Arrow(this.game, 20, 108)
    toKitchenArrow.rotation = Math.PI
    toKitchenArrow.interactionEnabled = true
    this.game.add.existing(toKitchenArrow)
    toKitchenArrow.events.onInputDown.addOnce(() => {
      toKitchenArrow.interactionEnabled = false
      this.fadeTo('kitchen')
    })

    const toTreeArrow = this.interactiveObjects.toTreeArrow = new Arrow(this.game, 192, 20)
    toTreeArrow.rotation = - Math.PI / 2
    toTreeArrow.interactionEnabled = true
    this.game.add.existing(toTreeArrow)
    toTreeArrow.events.onInputDown.addOnce(() => {
      toTreeArrow.interactionEnabled = false
      this.fadeTo('tree')
    })

    const antonius = this.characters.antonius = new AntoniusCharacter(this.game, 270, 120)
    antonius.scale = new Phaser.Point(3, 3)
    antonius.setActiveState('idle')
    this.game.add.existing(antonius)

  }
}

class Initial extends SceneState<ConcertScene> {
  public async show() {
    const scene = this.scene
    
  }
}
