import Scene from './scene'
import { SceneStateManager, SceneState, SceneStateTransition } from '../../utils/stateManager'

import { Images, Audio } from '../../assets'

import AntoniusCharacter from '../../characters/antonius'
import PainterCharacter from '../../characters/painter'
import BucketheadCharacter from '../../characters/buckethead'

import Arrow from '../../gameObjects/arrow'

import Inventory from '../../overlays/inventory'

export default class ForeheadScene extends Scene {
  public characters = {
    antonius: null,
    painter: null,
    buckethead: null
  }

  public interactiveObjects = {
    toCanopyArrow: null
  }

  stateManagers = {
    default: new SceneStateManager<ForeheadScene>(this, [
      Initial
    ], [

    ])
  }

  constructor(game: Phaser.Game) {
    super(
      game,
      Images.backgroundsBackgroundStirn.key,
      Audio.soundscapesScene3.key // TODO: replace with soundscape for scene 2
    )
  }

  protected createGameObjects() {
    const toCanopyArrow = this.interactiveObjects.toCanopyArrow = new Arrow(this.game, 364, 108)
    toCanopyArrow.interactionEnabled = true
    this.game.add.existing(toCanopyArrow)
    toCanopyArrow.events.onInputDown.addOnce(() => {
      toCanopyArrow.interactionEnabled = false
      this.fadeTo('canopy')
    })

    const antonius = this.characters.antonius = new AntoniusCharacter(this, 100, 100)
    antonius.scale = new Phaser.Point(3, 3)
    this.game.add.existing(antonius)

    const painter = this.characters.painter = new PainterCharacter(this, 200, 100)
    painter.scale = new Phaser.Point(3, 3)
    this.game.add.existing(painter)

    const bucket = this.characters.buckethead = new BucketheadCharacter(this, 50, 80)
    bucket.scale = new Phaser.Point(3, 3)
    this.game.add.existing(bucket)
  }

}

export class Initial extends SceneState<ForeheadScene> {
  public async show() {
    const scene = this.scene

  }
}
