import Scene from './scene'
import SceneState from './sceneState'

import * as Assets from '../../assets'

import HellmouthCharacter from '../../characters/hellmouth'
import AntoniusCharacter from '../../characters/antonius'

import Arrow from '../../gameObjects/arrow'

import ArrayUtils from '../../utils/arrayUtils'
import StringUtils from '../../utils/stringUtils'

export default class HeadScene extends Scene {
  hellmouth: HellmouthCharacter = null
  antonius: AntoniusCharacter = null

  toBardArrow: Arrow

  constructor() {
    super(
      Assets.Images.backgroundHead.key,
      InitialState
    )
  }

  protected createGameObjects() {
    // Add navigation arrow
    const arrow = this.toBardArrow = new Arrow(this.game, 300, 95)
    this.game.add.existing(arrow)

    // Add hellmouth
    const hellmouth = this.hellmouth = new HellmouthCharacter(this.game, 135, 40)
    this.game.add.existing(hellmouth)

    // Add antonius
    const antonius = this.antonius = new AntoniusCharacter(this.game, 258, 120)
    antonius.scale = new Phaser.Point(2, 2)
    this.game.add.existing(antonius)
  }
}

class InitialState implements SceneState<HeadScene> {
  constructor (public readonly scene: HeadScene) { }
  public getStateName() { return 'initial' }

  public async enter(): Promise<void> {
    const scene = this.scene

    // Transition to next scene
    scene.toBardArrow.events.onInputDown.addOnce(() => {
      scene.toBardArrow.enabled = false
      scene.fadeTo('bard')
    })

    function makeMouthTalk() {
      scene.hellmouth.inputEnabled = true
      scene.hellmouth.input.useHandCursor = true
      scene.hellmouth.events.onInputDown.addOnce(() => {
        scene.hellmouth.inputEnabled = false
        scene.game.canvas.style.cursor = 'default'
        scene.hellmouth.speech.say('hello', 2, null, async () => {
          scene.hellmouth.setActiveState('talking')
        })
        .then(() => scene.hellmouth.setActiveState('idle'))
        .then(makeMouthTalk)
      })
    }
    makeMouthTalk()

    function makeAntoniusTalk() {
      scene.antonius.inputEnabled = true
      scene.antonius.input.useHandCursor = true
      scene.antonius.speechPattern = Phaser.ArrayUtils.getRandomItem([
        'slslsl',
        'sllslsl',
        'llssll',
        'sssssssssl'
      ])
      console.log(scene.antonius.speechPattern)
      scene.antonius.events.onInputDown.addOnce(() => {
        scene.antonius.inputEnabled = false
        scene.game.canvas.style.cursor = 'default'
        scene.antonius.speech.say('hello', null, null, async () => {
          scene.antonius.setActiveState('talking')
        })
        .then(() => scene.antonius.setActiveState('idle'))
        .then(makeAntoniusTalk)
      })
    }
    makeAntoniusTalk()
  }
}
