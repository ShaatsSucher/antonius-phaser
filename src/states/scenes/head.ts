import Scene from './scene'
import SceneState from './sceneState'

import { Images, Audio } from '../../assets'

import HellmouthCharacter from '../../characters/hellmouth'
import AntoniusCharacter from '../../characters/antonius'

import Arrow from '../../gameObjects/arrow'

import { ArrayUtils, StringUtils } from '../../utils/utils'

export default class HeadScene extends Scene {
  hellmouth: HellmouthCharacter = null
  antonius: AntoniusCharacter = null

  toBardArrow: Arrow

  constructor() {
    super(
      Images.backgroundsHead.key,
      TheIntroduction,
      ThePathIsSet,
      TheCakeIsALie
    )
  }

  protected createGameObjects() {
    // Add navigation arrows
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

    scene.playAtmo(Audio.soundscapesScreen1.key)
    scene.playMusic(Audio.musicHeadScreen.key)

    scene.toBardArrow.visible = false
    await scene.hellmouth.setActiveState('idle')

    scene.hellmouth.interactionEnabled = true
    scene.hellmouth.events.onInputDown.addOnce(async () => {
      scene.hellmouth.interactionEnabled = false
      await scene.hellmouth.setActiveState('talking')

      const resetTalkingAnim = async () => {
        scene.hellmouth.setActiveState('talking')
      }

      await scene.hellmouth.speech.say('Um Gottes Willen...', 3)
      await scene.hellmouth.speech.say('Es toben ganz schön viele\ndieser Dämonen herum!!', 6)
      await scene.hellmouth.speech.say('Wenn du irgendwelche Fragen hast,\nkannst du dich jederzeit an mich wenden!', 6)
      await scene.hellmouth.speech.say('Du schaffst das, Antonius!', 3)
      await scene.hellmouth.speech.say('Wenn nicht du, wer dann?', 3)
      await scene.hellmouth.speech.say('Nun geh und leg los...', 3)

      scene.setActiveState('the path is set')
    })
  }
}

class ThePathIsSet implements SceneState<HeadScene> {
  constructor (public readonly scene: HeadScene) { }
  public getStateName() { return 'the path is set' }

  public async enter(): Promise<void> {
    const scene = this.scene

    scene.playAtmo(Audio.soundscapesScreen1.key)
    scene.playMusic(Audio.musicHeadScreen.key)

    await scene.hellmouth.setActiveState('idle')
    await scene.antonius.setActiveState('idle')

    scene.toBardArrow.visible = true
  }
}

class TheCakeIsALie implements SceneState<HeadScene> {
  constructor (public readonly scene: HeadScene) { }
  public getStateName() { return 'the cake is a lie' }

  public async enter(): Promise<void> {
    const scene = this.scene

    scene.playAtmo(Audio.soundscapesScreen1.key)
    scene.playMusic(Audio.musicHeadScreen.key)

    await scene.hellmouth.setActiveState('idle')
    await scene.antonius.setActiveState('idle')

    scene.hellmouth.interactionEnabled = true
    scene.hellmouth.events.onInputDown.addOnce(async () => {
      scene.hellmouth.interactionEnabled = false

      const resetTalkingAnim = async () => {
        scene.hellmouth.setActiveState('talking')
      }

      await scene.hellmouth.speech.say('Im Moment kannst du dem Minnesänger\nleider noch nicht helfen.', 4)
      await scene.hellmouth.speech.say('Im weiteren Spielverlauf findest du bestimmt\ngenau den richtigen Gegenstand für diese Situation.', 6)
      await scene.hellmouth.speech.say('Komme später noch einmal zurück.', 2)

      scene.setActiveState(this.getStateName())
    })

    scene.toBardArrow.visible = true
  }
}
