import Scene from './scene'
import { SceneStateManager, SceneState, SceneStateTransition } from '../../utils/stateManager'

import { Images, Audio } from '../../assets'

import HellmouthCharacter from '../../characters/hellmouth'
import AntoniusCharacter from '../../characters/antonius'

import BardCharacter from '../../characters/bard'
import GooseCharacter from '../../characters/goose'
import CatCharacter from '../../characters/cat'
import MeckieCharacter from '../../characters/meckie'

import Arrow from '../../gameObjects/arrow'
import Inventory from '../../overlays/inventory'

import { ArrayUtils, StringUtils } from '../../utils/utils'

export default class HeadScene extends Scene {
  hellmouth: HellmouthCharacter = null
  antonius: AntoniusCharacter = null

  toBardArrow: Arrow
  toFishArrow: Arrow

  stateManagers: { [name: string]: SceneStateManager<HeadScene> } = {
    default: new SceneStateManager(this, [
      Introduction,
      Silent,
      FishHintAvailable,
      Suction,
      TheEnd
    ], [
      IntroductionSpeech,
      FishHintSpeech,
      Credits
    ])
  }

  constructor() {
    super(Images.backgroundsHead.key)
  }

  protected createGameObjects() {
    // Add navigation arrows
    const arrow = this.toBardArrow = new Arrow(this.game, 300, 95)
    arrow.interactionEnabled = true
    this.game.add.existing(arrow)
    arrow.events.onInputUp.addOnce(() => {
      arrow.interactionEnabled = false
      this.fadeTo('bard')
    })
    const arrow2 = this.toFishArrow = new Arrow(this.game, 190, 200)
    arrow2.rotation = Math.PI / 2
    arrow2.interactionEnabled = true
    this.game.add.existing(arrow2)
    arrow2.events.onInputUp.addOnce(() => {
      arrow2.interactionEnabled = false
      this.fadeTo('fish')
    })

    // Add hellmouth
    const hellmouth = this.hellmouth = new HellmouthCharacter(this.game, 135, 40)
    this.game.add.existing(hellmouth)

    // Add antonius
    const antonius = this.antonius = new AntoniusCharacter(this.game, 258, 120)
    antonius.scale = new Phaser.Point(2, 2)
    this.game.add.existing(antonius)
  }

  async resetScene(showArrows = false) {
    this.playAtmo(Audio.soundscapesScreen1.key)
    this.playMusic(Audio.musicHeadScreen.key)

    this.toBardArrow.visible = showArrows
    this.toFishArrow.visible = showArrows

    this.hellmouth.interactionEnabled = false
    this.antonius.interactionEnabled = false

    await this.hellmouth.setActiveState('idle')
    await this.antonius.setActiveState('idle')
  }
}

class Introduction extends SceneState<HeadScene> {
  public async show() {
    await this.scene.resetScene()

    this.scene.hellmouth.interactionEnabled = true
    this.listeners.push(this.scene.hellmouth.events.onInputDown.addOnce(
      () => this.scene.defaultStateManager.trigger(IntroductionSpeech)
    ))
  }
}

class IntroductionSpeech extends SceneStateTransition<HeadScene> {
  public async enter(visible: boolean) {
    if (visible) {
      const scene = this.scene

      await scene.resetScene()

      await scene.hellmouth.speech.say('Um Gottes Willen...', 3)
      await scene.hellmouth.speech.say('Es toben ganz schön viele\ndieser Dämonen herum!!', 6)
      await scene.hellmouth.speech.say('Wenn du irgendwelche Fragen hast,\nkannst du dich jederzeit an mich wenden!', 6)
      await scene.hellmouth.speech.say('Du schaffst das, Antonius!', 3)
      await scene.hellmouth.speech.say('Wenn nicht du, wer dann?', 3)
      await scene.hellmouth.speech.say('Nun geh und leg los...', 3)
    }
    return Silent
  }
}

export class Silent extends SceneState<HeadScene> {
  public async show() {
    await this.scene.resetScene(true)
  }
}

export class FishHintAvailable extends SceneState<HeadScene> {
  public async show() {
    await this.scene.resetScene(true)

    this.scene.hellmouth.interactionEnabled = true
    this.listeners.push(this.scene.hellmouth.events.onInputUp.addOnce(
      () => this.scene.defaultStateManager.trigger(FishHintSpeech)
    ))
  }
}

class FishHintSpeech extends SceneStateTransition<HeadScene> {
  public async enter(visible: boolean) {
    if (visible) {
      await this.scene.resetScene()

      const scene = this.scene
      await scene.hellmouth.speech.say('Hmmm...\nAus dem Süden kommt ein merkwürdiger Geruch!', 4)
    }
    return FishHintAvailable
  }
}

export class Suction extends SceneState<HeadScene> {
  public async show() {
    await this.scene.resetScene()
    this.stateManager.trigger(Credits)
  }
}

class Credits extends SceneStateTransition<HeadScene> {
  public async enter(visible: boolean) {
    if (visible) {
      const scene = this.scene
      await scene.resetScene()

      scene.settingsButton.visible = false
      Inventory.instance.visible = false

      scene.antonius.x = 280

      let creditsDoneCallback: () => void
      const creditsDone = new Promise<void>(resolve => { creditsDoneCallback = resolve })

      const meckie = new MeckieCharacter(scene.game, 0, 0)
      meckie.scale.setTo(-2, 2)
      meckie.anchor.setTo(0.5, 0.3)
      meckie.x = scene.game.width + meckie.anchor.x * meckie.width * meckie.scale.x
      meckie.y = 170
      await meckie.setActiveState('walking')
      scene.add.existing(meckie)
      scene.tweens.create(meckie).to({
        x: 198,
        y: 143
      }, 3000).start().onComplete.addOnce(() => {
        // Suction!
        meckie.setActiveState('idle')
        scene.hellmouth.setActiveState('open mouth')
        scene.sound.play(Audio.hellmouthWhirlwind001.key)
        scene.tweens.create(meckie).to({ rotation: Math.PI * 10 }, 5000, Phaser.Easing.Cubic.In, true)
        scene.tweens.create(meckie.scale).to({ x: 0, y: 0 }, 5000, Phaser.Easing.Cubic.In, true)
        .onComplete.addOnce(async () => {
          await scene.hellmouth.setActiveState('close mouth')

          const cat = new CatCharacter(scene.game, 0, 0)
          cat.scale.setTo(-2, 2)
          cat.anchor.setTo(0.5, 0)
          cat.x = scene.game.width + cat.anchor.x * cat.width * cat.scale.x
          cat.y = 170
          await cat.setActiveState('walking')
          scene.add.existing(cat)
          scene.tweens.create(cat).to({
            x: 198,
            y: 143
          }, 3000).start().onComplete.addOnce(() => {
            cat.setActiveState('idle')
            scene.hellmouth.setActiveState('open mouth')
            scene.sound.play(Audio.hellmouthWhirlwind001.key)
            scene.tweens.create(cat).to({ rotation: Math.PI * 10 }, 5000, Phaser.Easing.Cubic.In, true)
            scene.tweens.create(cat.scale).to({ x: 0, y: 0 }, 5000, Phaser.Easing.Cubic.In, true)
            .onComplete.addOnce(async () => {
              await scene.hellmouth.setActiveState('close mouth')

              const goose = new GooseCharacter(scene.game, 0, 0)
              goose.scale.setTo(-2, 2)
              goose.anchor.setTo(0.5, 0.4)
              goose.x = scene.game.width + goose.anchor.x * goose.width * goose.scale.x
              goose.y = 150
              await goose.setActiveState('walking')
              scene.add.existing(goose)
              scene.tweens.create(goose).to({
                x: 198,
                y: 143
              }, 3000).start().onComplete.addOnce(() => {
                goose.setActiveState('idle')
                scene.tweens.create(goose).to({ rotation: Math.PI * 10 }, 5000, Phaser.Easing.Cubic.In, true)
                scene.tweens.create(goose.scale).to({ x: 0, y: 0 }, 5000, Phaser.Easing.Cubic.In, true)
              })

              const bard = new BardCharacter(scene.game, 0, 0)
              bard.scale.setTo(-2, 2)
              bard.anchor.setTo(0.5, 0.4)
              bard.x = scene.game.width + bard.anchor.x * bard.width * bard.scale.x
              bard.y = 150
              await bard.setActiveState('walking')
              scene.add.existing(bard)
              scene.tweens.create(bard).to({
                x: 198,
                y: 143
              }, 3000).start().onComplete.addOnce(() => {
                bard.setActiveState('idle')
                scene.hellmouth.setActiveState('open mouth')
                scene.sound.play(Audio.hellmouthWhirlwind001.key)
                scene.tweens.create(bard).to({ rotation: Math.PI * 10 }, 5000, Phaser.Easing.Cubic.In, true)
                scene.tweens.create(bard.scale).to({ x: 0, y: 0 }, 5000, Phaser.Easing.Cubic.In, true).onComplete.addOnce(async () => {
                  await scene.hellmouth.setActiveState('close mouth')
                  scene.fadeTo('end')
                })
              })
            })
          })
        })
      })

      await creditsDone
      return TheEnd
    }
  }
}

export class TheEnd extends SceneState<HeadScene> {

}
