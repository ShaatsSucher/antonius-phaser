import Scene from './scene'
import SceneState from './sceneState'

import * as Assets from '../../assets'

import ArrayUtils from '../../utils/arrayUtils'
import StringUtils from '../../utils/stringUtils'

export default class IntroScene extends Scene {
  startButton: Phaser.Text

  constructor() {
    super('', InitialState)
  }

  protected createGameObjects() {
    this.startButton = this.add.text(this.world.centerX, this.world.centerY,
      'Insert intro here', {
        fill: 'white'
      })
    this.startButton.anchor = new Phaser.Point(0.5, 0.5)
  }
}

class InitialState implements SceneState<IntroScene> {
  constructor(public readonly scene: IntroScene) { }
  public getStateName() { return 'initial' }

  public async enter(): Promise<void> {
    this.scene.startButton.inputEnabled = true
    this.scene.startButton.input.useHandCursor = true
    this.scene.startButton.events.onInputDown.addOnce(() => {
      this.scene.fadeTo('head')
    })
  }
}
