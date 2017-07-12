import Scene from './scene'
import SceneState from './sceneState'

import { Images, Audio } from '../../assets'

import AntoniusCharacter from '../../characters/antonius'
import FishCharacter from '../../characters/fish'

import Arrow from '../../gameObjects/arrow'

import Inventory from '../../overlays/inventory'
import { ArrayUtils, StringUtils } from '../../utils/utils'

export default class FishScene extends Scene {
  antonius: AntoniusCharacter = null
  fish: FishCharacter

  toHeadArrow: Arrow

  constructor() {
    super(
      Images.backgroundsFish.key,
      Start,
      FishAlive,
      FishDying,
      FishDead,
      FishGone
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

class Start implements SceneState<FishScene> {
  constructor (public readonly scene: FishScene) { }
  public getStateName() { return 'start' }

  public async enter(): Promise<void> {
    const scene = this.scene

    scene.playAtmo(Audio.soundscapesScreen1.key)
    scene.playMusic(Audio.musicHeadScreen.key)

    scene.toHeadArrow.visible = true

    scene.fish.setInteractionEnabled(true)
    scene.fish.events.onInputDown.addOnce(async () => {
      scene.toHeadArrow.visible = false
      scene.fish.setInteractionEnabled(false)

      await scene.antonius.speech.say('Ach, ich dachte doch\nirgendwas riecht hier fischig', 6, 'ssslsss')
      await scene.fish.speech.say('Ent-schul-di-gung, aber was so "fischig"\nriecht ist ein Canal No. 5!', 10)
      await scene.antonius.speech.say('Oh, du sprichst!', 3, 'lss')
      await scene.fish.speech.say('Nicht nur spreche ich, ich atme Luft!\nWasser ist ja *schnauf* so was von altmodisch.', 8)
      await scene.fish.speech.say('Frischluft, *röchel* das atmet man heutzutage!', 6)
      await scene.antonius.speech.say('Sicher, dass es dir gut geht?\nDu siehst ein bisschen blass um die Kiemen aus...', 6, 'ssslsls')
      await scene.fish.speech.say('Mir geht es *keuch* BLEN-DEND!', 5)

      scene.setActiveState('fish alive')
    })
  }
}

class FishAlive implements SceneState<FishScene> {
  constructor (public readonly scene: FishScene) { }
  public getStateName() { return 'fish alive' }

  public async enter(): Promise<void> {
    const scene = this.scene

    scene.toHeadArrow.visible = true

    scene.fish.setInteractionEnabled(true)
    scene.fish.events.onInputDown.addOnce(async () => {
      scene.fish.setInteractionEnabled(false)

      await scene.fish.speech.say('Mir geht es *keuch* BLEN-DEND!', 5)

      // if (scene.game.state.states.bard.getStateName() != 'cat') {
        scene.setActiveState(this.getStateName())
      // } else {
      //   scene.setActiveState('fish dead')
      // }
    })
  }
}

class FishDying implements SceneState<FishScene> {
  constructor (public readonly scene: FishScene) { }
  public getStateName() { return 'fish dying' }

  public async enter(): Promise<void> {
    const scene = this.scene

    scene.toHeadArrow.visible = true

    scene.fish.setInteractionEnabled(true)
    scene.fish.events.onInputDown.addOnce(async () => {
      scene.fish.setInteractionEnabled(false)
      scene.toHeadArrow.visible = false

      await scene.fish.speech.say('Luft atmen ist *japs* gesund!', 4)
      await scene.fish.speech.say('Es verjüngt die Haut, es reinigt die Poren,\nalles dank der Lunge!', 6)
      await scene.fish.speech.say('... Moment, hab ich eigentlich eine Lunge?', 5)

      scene.fish.setActiveState('dying')
      const deathSound = scene.sound.play(Audio.fishFishDiesFishDies.key)
      deathSound.onStop.addOnce(async () => {
        console.log('ded')
        scene.setActiveState('fish dead')
      })

      // scene.antonius.speech.say('Hmm… alles Teil von Gottes Plan. Ganz bestimmt.', 6, 'ssssss')
    })
  }
}

class FishDead implements SceneState<FishScene> {
  constructor (public readonly scene: FishScene) { }
  public getStateName() { return 'fish dead' }

  public async enter(): Promise<void> {
    const scene = this.scene

    scene.toHeadArrow.visible = true

    scene.fish.setInteractionEnabled(true)
    scene.fish.events.onInputDown.addOnce(async () => {
      scene.fish.setInteractionEnabled(false)

      scene.fish.visible = false

      Inventory.instance.item = Images.fish.key
      scene.setActiveState('fish gone')
    })
  }
}

class FishGone implements SceneState<FishScene> {
  constructor (public readonly scene: FishScene) { }
  public getStateName() { return 'fish gone' }

  public async enter(): Promise<void> {
    this.scene.fish.visible = false
  }
}
