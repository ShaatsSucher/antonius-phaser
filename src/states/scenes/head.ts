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
      TheIntroduction,
      ThePathIsSet,
      TheCakeIsALie
    )
  }

  protected createGameObjects() {
    // Add navigation arrow
    const arrow = this.toBardArrow = new Arrow(this.game, 300, 95)
    arrow.interactionEnabled = true
    this.game.add.existing(arrow)
    arrow.events.onInputDown.addOnce(() => {
      arrow.interactionEnabled = false
      this.fadeTo('bard')
    })

    // Add hellmouth
    const hellmouth = this.hellmouth = new HellmouthCharacter(this.game, 135, 40)
    this.game.add.existing(hellmouth)

    // Add antonius
    const antonius = this.antonius = new AntoniusCharacter(this.game, 258, 120)
    antonius.scale = new Phaser.Point(2, 2)
    this.game.add.existing(antonius)
  }
}

class TheIntroduction implements SceneState<HeadScene> {
  constructor (public readonly scene: HeadScene) { }
  public getStateName() { return 'the introduction' }

  public async enter(): Promise<void> {
    const scene = this.scene

    scene.toBardArrow.visible = false
    await scene.hellmouth.setActiveState('idle')

    scene.hellmouth.interactionEnabled = true
    scene.hellmouth.events.onInputDown.addOnce(async () => {
      scene.hellmouth.interactionEnabled = false
      await scene.hellmouth.setActiveState('talking')

      const resetTalkingAnim = async () => {
        scene.hellmouth.setActiveState('talking')
      }

      await scene.hellmouth.speech.say('Um Gottes Willen...', 3, null, resetTalkingAnim)
      await scene.hellmouth.speech.say('Es toben ganz schön viele\ndieser Dämonen herum!!', 6, null, resetTalkingAnim)
      await scene.hellmouth.speech.say('Wenn du irgendwelche Fragen hast,\nkannst du dich jederzeit an mich wenden!', 6, null, resetTalkingAnim)
      await scene.hellmouth.speech.say('Du schaffst das, Antonius!', 3, null, resetTalkingAnim)
      await scene.hellmouth.speech.say('Wenn nicht du, wer dann?', 3, null, resetTalkingAnim)
      await scene.hellmouth.speech.say('Nun geh und leg los...', 3, null, resetTalkingAnim)

      scene.setActiveState('the path is set')
    })
  }
}

class ThePathIsSet implements SceneState<HeadScene> {
  constructor (public readonly scene: HeadScene) { }
  public getStateName() { return 'the path is set' }

  public async enter(): Promise<void> {
    const scene = this.scene

    await scene.hellmouth.setActiveState('idle')
    await scene.antonius.setActiveState('idle')

    scene.toBardArrow.visible = true
  }
}

class TheCakeIsALie implements SceneState<HeadScene> {
  constructor (public readonly scene: HeadScene) { }
  public getStateName() { return 'the cake is a lie' }

  private inputBinding

  public async enter(): Promise<void> {
    const scene = this.scene

    await scene.hellmouth.setActiveState('idle')
    await scene.antonius.setActiveState('idle')

    scene.antonius.interactionEnabled = true
    scene.antonius.events.onInputDown.add(async () => {
      scene.antonius.interactionEnabled = false

      const resetTalkingAnim = async () => {
        scene.hellmouth.setActiveState('talking')
      }

      await scene.hellmouth.speech.say('Im Moment kannst du dem Minnesänger\nleider noch nicht helfen.', 4, null, resetTalkingAnim)
      await scene.hellmouth.speech.say('Im weiteren Spielverlauf findest du bestimmt\ngenau den richtigen Gegenstand für diese Situation.', 6, null, resetTalkingAnim)
      await scene.hellmouth.speech.say('Komme später noch einmal zurück.', 2, null, resetTalkingAnim)

      await scene.hellmouth.setActiveState('idle')
      scene.hellmouth.interactionEnabled = true
    })

    scene.toBardArrow.visible = true
  }
}
