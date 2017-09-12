import Scene from './scene'
import { SceneStateManager, SceneState, SceneStateTransition } from '../../utils/stateManager'

import { Images, Audio } from '../../assets'

import HellmouthCharacter from '../../characters/hellmouth'
import AntoniusCharacter from '../../characters/antonius'

import Character from '../../characters/character'
import BardCharacter from '../../characters/bard'
import GooseCharacter from '../../characters/goose'
import CatCharacter from '../../characters/cat'
import MeckieCharacter from '../../characters/meckie'

import Arrow from '../../gameObjects/arrow'
import Inventory from '../../overlays/inventory'

import { ArrayUtils, StringUtils } from '../../utils/utils'

export default class HeadScene extends Scene {
  public characters = {
    hellmouth: null,
    antonius: null
  }

  public interactiveObjects = {
    toBardArrow: null,
    toFishArrow: null
  }

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

  constructor(game: Phaser.Game) {
    super(
      game,
      Images.backgroundsHead.key,
      Audio.soundscapesScene5.key,
      Audio.musicHeadScreen.key
    )
  }

  protected createGameObjects() {
    // Add navigation arrows
    const arrow = this.interactiveObjects.toBardArrow = new Arrow(this.game, 300, 95)
    arrow.interactionEnabled = true
    this.game.add.existing(arrow)
    arrow.events.onInputUp.addOnce(() => {
      arrow.interactionEnabled = false
      this.fadeTo('bard')
    })
    const arrow2 = this.interactiveObjects.toFishArrow = new Arrow(this.game, 190, 200)
    arrow2.rotation = Math.PI / 2
    arrow2.interactionEnabled = true
    this.game.add.existing(arrow2)
    arrow2.events.onInputUp.addOnce(() => {
      arrow2.interactionEnabled = false
      this.fadeTo('fish')
    })

    // Add hellmouth
    const hellmouth = this.characters.hellmouth = new HellmouthCharacter(this.game, 135, 40)
    this.game.add.existing(hellmouth)

    // Add antonius
    const antonius = this.characters.antonius = new AntoniusCharacter(this.game, 258, 120)
    antonius.scale = new Phaser.Point(2, 2)
    this.game.add.existing(antonius)
  }

  async resetScene(showArrows = false) {
    this.interactiveObjects.toBardArrow.visible = showArrows
    this.interactiveObjects.toFishArrow.visible = showArrows

    this.characters.hellmouth.interactionEnabled = false
    this.characters.antonius.interactionEnabled = false

    await this.characters.hellmouth.setActiveState('idle')
    await this.characters.antonius.setActiveState('idle')
  }
}

class Introduction extends SceneState<HeadScene> {
  public async show() {
    await this.scene.resetScene()

    this.scene.characters.hellmouth.interactionEnabled = true
    this.listeners.push(this.scene.characters.hellmouth.events.onInputDown.addOnce(
      () => this.scene.defaultStateManager.trigger(IntroductionSpeech)
    ))
  }
}

class IntroductionSpeech extends SceneStateTransition<HeadScene> {
  public async enter(visible: boolean) {
    if (visible) {
      const scene = this.scene

      await scene.resetScene()

      await scene.characters.hellmouth.speech.say('Um Gottes Willen...', 3)
      await scene.characters.hellmouth.speech.say('Es toben ganz schön viele\ndieser Dämonen herum!!', 6)
      await scene.characters.hellmouth.speech.say('Wenn du irgendwelche Fragen hast,\nkannst du dich jederzeit an mich wenden!', 6)
      await scene.characters.hellmouth.speech.say('Du schaffst das, Antonius!', 3)
      await scene.characters.hellmouth.speech.say('Wenn nicht du, wer dann?', 3)
      await scene.characters.hellmouth.speech.say('Nun geh und leg los...', 3)
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

    this.scene.characters.hellmouth.interactionEnabled = true
    this.listeners.push(this.scene.characters.hellmouth.events.onInputUp.addOnce(
      () => this.scene.defaultStateManager.trigger(FishHintSpeech)
    ))
  }
}

class FishHintSpeech extends SceneStateTransition<HeadScene> {
  public async enter(visible: boolean) {
    if (visible) {
      await this.scene.resetScene()

      const scene = this.scene
      await scene.characters.hellmouth.speech.say('Hmmm...\nAus dem Süden kommt ein merkwürdiger Geruch!', 4)
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

      scene.characters.antonius.x = 280

      const swallow = async (characters: Character[] | Character, anchorY: number, walkStartY = 170) => {
        let chars = characters instanceof Character ? [characters] : characters

        await Promise.all(chars.map(async character => {
          // Make character face left
          character.scale.setTo(-2, 2)

          // Center the character's anchor
          character.anchor.setTo(0.5, anchorY)

          // Place character just right of the frame
          character.x = scene.game.width + character.anchor.x * character.width * character.scale.x
          character.y = walkStartY

          await character.setActiveState('walking')
          scene.add.existing(character)

          // Move the character in front of the mouth
          await scene.tweens.create(character).to({
            x: 198,
            y: 143
          }, 3000).start().onComplete.asPromise()
          await character.setActiveState('idle')
        }))

        scene.characters.hellmouth.setActiveState('open mouth')
        scene.sound.play(Audio.hellmouthWhirlwind001.key)

        await Promise.all(chars.map(async character => {
          await Promise.all([
            scene.tweens.create(character).to({ rotation: Math.PI * 10 }, 5000, Phaser.Easing.Cubic.In, true).onComplete.asPromise(),
            scene.tweens.create(character.scale).to({ x: 0, y: 0}, 5000, Phaser.Easing.Cubic.In, true).onComplete.asPromise()
          ])
        }))

        await scene.characters.hellmouth.setActiveState('close mouth')
      }

      await swallow(new MeckieCharacter(scene.game, 0, 0), 0.3)
      await swallow(new CatCharacter(scene.game, 0, 0), 0)
      await swallow([
        new GooseCharacter(scene.game, 0, 0),
        new BardCharacter(scene.game, 0, 0)
      ], 0.4, 150)

      return TheEnd
    }
  }
}

export class TheEnd extends SceneState<HeadScene> {
  public async show() {
    this.scene.fadeTo('end')
  }
}
