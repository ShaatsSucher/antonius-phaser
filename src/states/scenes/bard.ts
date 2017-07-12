import Scene from './scene'
import SceneState from './sceneState'

import * as Assets from '../../assets'

import AntoniusCharacter from '../../characters/antonius'
import BardCharacter from '../../characters/bard'
import GooseCharacter from '../../characters/goose'
import CatCharacter from '../../characters/cat'
import MeckieCharacter from '../../characters/meckie'

import Arrow from '../../gameObjects/arrow'

import SheechHelper from '../../utils/speechHelper'

import Inventory from '../../overlays/inventory'
import { ArrayUtils, StringUtils } from '../../utils/utils'

export default class BardScene extends Scene {
  goose: GooseCharacter
  bard: BardCharacter
  cat: CatCharacter
  meckie: MeckieCharacter

  antonius: AntoniusCharacter

  toHeadArrow: Arrow

  constructor() {
    super(
      Assets.Images.backgroundsBard.key,
      InitialState,
      BardConversationState,
      MeckieConversationState,
      CatState,
      DogState
    )
  }

  protected createGameObjects() {
    const goose = this.goose = new GooseCharacter(this.game, 48, 10)
    goose.scale = new Phaser.Point(3, 3)
    goose.setActiveState('idle')
    this.add.existing(goose)

    const bard = this.bard = new BardCharacter(this.game, 48, 10)
    bard.scale = new Phaser.Point(3, 3)
    bard.setActiveState('idle')
    this.add.existing(bard)

    const cat = this.cat = new CatCharacter(this.game, 48, 10)
    cat.scale = new Phaser.Point(3, 3)
    cat.setActiveState('idle')
    this.add.existing(cat)

    const meckie = this.meckie = new MeckieCharacter(this.game, 30, 120)
    meckie.scale = new Phaser.Point(3, 3)
    meckie.setActiveState('idle')
    this.add.existing(meckie)

    const antonius = this.antonius = new AntoniusCharacter(this.game, 292, 120)
    antonius.scale = new Phaser.Point(3, 3)
    antonius.setActiveState('idle')
    this.add.existing(antonius)

    const arrow = this.toHeadArrow = new Arrow(this.game, 20, 95)
    arrow.rotation = Math.PI
    arrow.interactionEnabled = true
    this.game.add.existing(arrow)
    arrow.events.onInputDown.addOnce(() => {
      arrow.interactionEnabled = false
      this.fadeTo('head')
    })

  }
}

class InitialState implements SceneState<BardScene> {
  constructor(public readonly scene: BardScene) { }
  public getStateName() { return 'initial' }

  public async enter(): Promise<void> {
    const scene = this.scene

    scene.bard.setInteractionEnabled(true)
    scene.bard.events.onInputDown.addOnce(async () => {
      scene.toHeadArrow.visible = false
      scene.meckie.setInteractionEnabled(false)

      scene.setActiveState('bard conversation')
    })

    scene.meckie.setInteractionEnabled(true)
    scene.meckie.events.onInputDown.addOnce(async () => {
      scene.toHeadArrow.visible = false
      scene.bard.setInteractionEnabled(false)

      scene.setActiveState('meckie conversation')
    })

  }
}

class BardConversationState implements SceneState<BardScene> {
  constructor(public readonly scene: BardScene) { }
  public getStateName() { return 'bard conversation' }

  public async enter(): Promise<void> {
    const scene = this.scene

    scene.bard.setActiveState('singing')
    const bardSong = scene.sound.play(Assets.Audio.bardSong.key)
    bardSong.onStop.addOnce(async () => {
      console.log('done')
    })
    scene.bard.events.onInputDown.addOnce(async () => {
      bardSong.stop()
      scene.bard.setActiveState('idle')

      scene.bard.setInteractionEnabled(false)

      await scene.goose.speech.say('Ach du meine Güte.\n Wie theatralisch!', 3)
      await scene.antonius.speech.say('Ihr da, auf dem fantastischen Reitwesen!', 6, 'slssls')
      await scene.antonius.speech.say('Dieses Lied klingt so unendlich einsam,\nwarum seid Ihr so traurig?', 8, 'ssssssss')
      await scene.bard.speech.say('Hört mir denn keiner zu?\nIch vermisse meine Freundin,\ndie Reitgans, sehr!', 10)
      await scene.goose.speech.say('So weit sind wir ja nicht von einander entfernt...', 6)
      await scene.antonius.speech.say('Stimmt, soweit seid ihr doch\nnicht voneinander entfernt.', 8, 'sssssss')
      await scene.antonius.speech.say('Dreht euch doch ein mal um.', 3, 'ssl')
      await scene.bard.speech.say('Das geht nicht. Da ist etwas hinter mir!', 6)
      await scene.antonius.speech.say('Ich sehe das Problem.\nVielleicht kann ich helfen.', 8, 'ssssss')


      scene.game.state.states.head.setActiveState('the cake is a lie')
      scene.game.state.states.fish.setActiveState('fish dying')
      scene.setActiveState('cat')
    })

  }
}

class MeckieConversationState implements SceneState<BardScene> {
  constructor(public readonly scene: BardScene) { }
  public getStateName() { return 'meckie conversation' }

  public async enter(): Promise<void> {
    const scene = this.scene

    scene.meckie.setInteractionEnabled(false)

    await scene.meckie.speech.say('Schnibbel schnabbel schnapp!\nIch schneid dir die Kapuze ab!', 6)
    await scene.antonius.speech.say('Immer mit der Ruhe!\nWas hast du denn mit dem Messer vor?', 6, 'sslssl')
    await scene.meckie.speech.say('Ich häcksel alles, groß und klein\nund du könntest der nächste sein', 6)
    await scene.antonius.speech.say('Wäre es in Ordnung wenn du das...\nnicht tun könntest?', 6, 'sslsss')
    await scene.meckie.speech.say('Verschonen könnt ich dich vielleicht,\neinfach was zum hacken reicht.', 6)
    await scene.meckie.speech.say('Wie wär’s mit ‘nem Zerteil-Versuch\nmit deinem kleinen Bibel-Buch? Hähähähä!', 7)
    await scene.antonius.speech.say('Also bitte, dies ist ein Buch Gottes!', 4, 'ssss')
    await scene.meckie.speech.say('Willst du nicht enden als Eingeweide,\nbring etwas, das ich zerschneide!', 6)

    scene.setActiveState('dog')
  }
}

class CatState implements SceneState<BardScene> {
  constructor(public readonly scene: BardScene) { }
  public getStateName() { return 'cat' }

  public async enter(): Promise<void> {
    const scene = this.scene

    scene.toHeadArrow.visible = true

    scene.cat.setInteractionEnabled(true)
    scene.cat.events.onInputDown.addOnce(async () => {
      await scene.cat.speech.say('[genervtes Miauen]', 4)
      await scene.antonius.speech.say('Das wird wohl schwieriger als gedacht...', 6, 'ssssss')
    })
  }
}

class DogState implements SceneState<BardScene> {
  constructor(public readonly scene: BardScene) { }
  public getStateName() { return 'dog' }

  public async enter(): Promise<void> {
    const scene = this.scene

    scene.toHeadArrow.visible = true

    scene.bard.setInteractionEnabled(true)
    scene.bard.events.onInputDown.addOnce(async () => {
      scene.toHeadArrow.visible = false
      scene.setActiveState('bard conversation')
    })

    scene.meckie.setInteractionEnabled(true)
    scene.meckie.events.onInputDown.addOnce(async () => {
      scene.meckie.setInteractionEnabled(false)

      if (Inventory.instance.item === Assets.Images.fish.key) {
        Inventory.instance.item = null

        await scene.antonius.speech.say('Ich hätte hier einen Fisch,\nden du vielleicht zerschneiden könntest.', 6, 'ssssss')
        await scene.meckie.speech.say('Ein Wasservieh, frisch aus der See,\nverwandle ich in Lachsfilet!', 6)
        await scene.antonius.speech.say('Toll! Willst du denn damit etwas kochen, oder…?', 5, 'ssssl')
        await scene.meckie.speech.say('Was ich tun wollt’ hab ich getan,\nich bin ja eigentlich vegan.', 6)
        await scene.antonius.speech.say('Praktisch!', 1, 's')
        await scene.meckie.speech.say('Das war jetzt auch mein letzter Reim,\nden Rest zerschnibbel ich daheim.', 6)
        await scene.antonius.speech.say('Tschuess!', 1, 'l')

        Inventory.instance.item = Assets.Images.filet.key

        scene.setActiveState('cat')
      } else {
        await scene.meckie.speech.say('Willst du nicht enden als Eingeweide,\nbring etwas, das ich zerschneide!', 6)
        scene.setActiveState('dog')
      }
    })
  }
}
