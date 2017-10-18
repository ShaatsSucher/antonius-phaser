import Scene from './scene'
import { SceneStateManager, SceneState, SceneStateTransition } from '../../utils/stateManager'

import { Images, Audio } from '../../assets'

import AntoniusCharacter from '../../characters/antonius'
import TreeCharacter from '../../characters/tree'
import WomanCharacter from '../../characters/woman'
import GoatCharacter from '../../characters/goat'

import Arrow from '../../gameObjects/arrow'

import Inventory from '../../overlays/inventory'

export default class TreeScene extends Scene {
  public characters = {
    antonius: null,
    tree: null,
    woman: null,
    goat: null
  }

  public interactiveObjects = {
    toBardArrow: null,
    toConcertArrow: null
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

    const toConcertArrow = this.interactiveObjects.toConcertArrow = new Arrow(this.game, 190, 200)
    toConcertArrow.rotation = Math.PI / 2
    toConcertArrow.interactionEnabled = true
    this.game.add.existing(toConcertArrow)
    toConcertArrow.events.onInputDown.addOnce(() => {
      toBardArrow.interactionEnabled = false
      this.fadeTo('concert')
    })

    const antonius = this.characters.antonius = new AntoniusCharacter(this.game, 100, 100)
    antonius.scale = new Phaser.Point(-3, 3)
    this.game.add.existing(antonius)

    const tree = this.characters.tree = new TreeCharacter(this.game, 300, 50)
    tree.scale = new Phaser.Point(0.5, 1.5)
    this.game.add.existing(tree)

    const woman = this.characters.woman = new WomanCharacter(this.game, 250, 120)
    woman.scale = new Phaser.Point(0.2, 0.5)
    this.game.add.existing(woman)

    const goat = this.characters.goat = new GoatCharacter(this.game, 280, 100)
    goat.scale = new Phaser.Point(3, 3)
    this.game.add.existing(goat)
  }
}

class Initial extends SceneState<TreeScene> {
  public async show() {
    const scene = this.scene
  }
}
