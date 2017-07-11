import Scene from './scene'
import SceneState from './sceneState'

import { Images, Audio } from '../../assets'

import AntoniusCharacter from '../../characters/antonius'
import FishCharacter from '../../characters/fish'

import Arrow from '../../gameObjects/arrow'

import { ArrayUtils, StringUtils } from '../../utils/utils'

export default class FishScene extends Scene {
  antonius: AntoniusCharacter = null
  fish: FishCharacter

  toHeadArrow: Arrow

  constructor() {
    super(
      Images.backgroundsFish.key,
      TheIntroduction
    )
  }

  protected createGameObjects() {
    // Add navigation arrow
    const arrow = this.toHeadArrow = new Arrow(this.game, 190, 20)
    arrow.rotation = - Math.PI / 2
    arrow.interactionEnabled = true
    this.game.add.existing(arrow)
    arrow.events.onInputDown.addOnce(() => {
      arrow.interactionEnabled = false
      this.fadeTo('head')
    })

    // Add antonius
    const antonius = this.antonius = new AntoniusCharacter(this.game, 270, 120)
    antonius.scale = new Phaser.Point(3, 3)
    antonius.setActiveState('idle')
    this.game.add.existing(antonius)

    const fish = this.fish = new FishCharacter(this.game, 150, 120)
    fish.scale = new Phaser.Point(3, 3)
    this.game.add.existing(fish)
  }
}

class TheIntroduction implements SceneState<FishScene> {
  constructor (public readonly scene: FishScene) { }
  public getStateName() { return 'the introduction' }

  public async enter(): Promise<void> {
    const scene = this.scene

    scene.playAtmo(Audio.soundscapesScreen1.key)
    scene.playMusic(Audio.musicHeadScreen.key)

    scene.toHeadArrow.visible = true
  }
}
