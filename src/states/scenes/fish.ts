import Scene from './scene'
import { SceneStateManager, SceneState, SceneStateTransition } from '../../utils/stateManager'
import { AntoniusBroughtFish } from './bard'
import { Silent } from './head'

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

  stateManagers = {
    default: new SceneStateManager<FishScene>(this, [
      Initial,
      FishAlive,
      FishDying,
      FishDead,
      FishGone
    ], [
      FishConversation,
      ImFine,
      Suffocation,
      CollectFish
    ])
  }

  constructor() {
    super(
      Images.backgroundsFish.key,
      Audio.soundscapesScene9.key,
      Audio.musicHeadScreen.key
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

  async resetScene(showArrows = false) {
<<<<<<< HEAD
=======
    this.playAtmo(Audio.soundscapesScene9.key)
    this.playMusic(Audio.musicHeadScreen.key)

>>>>>>> master
    this.toHeadArrow.visible = showArrows

    this.fish.interactionEnabled = false
    this.antonius.interactionEnabled = false

    await this.fish.setActiveState('idle')
    await this.antonius.setActiveState('idle')
  }
}

class Initial extends SceneState<FishScene> {
  public async show() {
    const scene = this.scene
    await scene.resetScene(true)

    scene.fish.interactionEnabled = true

    this.listeners.push(scene.fish.events.onInputUp.addOnce(
      () => this.stateManager.trigger(FishConversation))
    )
  }
}

class FishConversation extends SceneStateTransition<FishScene> {
  public async enter() {
    const scene = this.scene
    await scene.resetScene()

    await scene.antonius.speech.say('Ach, ich dachte doch\nirgendwas riecht hier fischig', null, 'ssslsss')
    await scene.fish.speech.say('Ent-schul-di-gung, aber was so "fischig"\nriecht ist ein Canal No. 5!', 10)
    await scene.antonius.speech.say('Oh, du sprichst!', null, 'lss')
    await scene.fish.speech.say('Nicht nur spreche ich, ich atme Luft!\nWasser ist ja *schnauf* so was von altmodisch.', 8)
    await scene.fish.speech.say('Frischluft, *röchel* das atmet man heutzutage!', 6)
    await scene.antonius.speech.say('Sicher, dass es dir gut geht?\nDu siehst ein bisschen blass um die Kiemen aus...', null, 'ssslsls')

    return ImFine
  }
}

class ImFine extends SceneStateTransition<FishScene> {
  public async enter() {
    const scene = this.scene
    await scene.resetScene()

    await scene.fish.speech.say('Mir geht es *keuch* BLEN-DEND!', 5)

    return FishAlive
  }
}

export class FishAlive extends SceneState<FishScene> {
  public async show() {
    console.log('fish alive')
    const scene = this.scene
    await scene.resetScene(true)

    scene.fish.interactionEnabled = true

    this.listeners.push(scene.fish.events.onInputUp.addOnce(
      () => this.stateManager.trigger(ImFine))
    )
  }
}

export class FishDying extends SceneState<FishScene> {
  public async show() {
    console.log('fish dying')
    const scene = this.scene
    await scene.resetScene(true)

    scene.fish.interactionEnabled = true

    this.listeners.push(scene.fish.events.onInputDown.addOnce(
      () => this.stateManager.trigger(Suffocation)
    ))
  }
}

class Suffocation extends SceneStateTransition<FishScene> {
  public async enter() {
    const scene = this.scene
    await scene.resetScene()

    await scene.fish.speech.say('Luft atmen ist *japs* gesund!', 4)
    await scene.fish.speech.say('Es verjüngt die Haut, es reinigt die Poren,\nalles dank der Lunge!', 6)
    await scene.fish.speech.say('... Moment, hab ich eigentlich eine Lunge?', 5)

    await scene.fish.setActiveState('dying')
    const deathSound = scene.sound.play(Audio.fishFishDiesFishDies.key)

    let soundDoneCallback: () => void
    const soundDone = new Promise<void>(resolve => { soundDoneCallback = resolve })
    deathSound.onStop.addOnce(soundDoneCallback)

    await soundDone

    await scene.antonius.speech.say('Hmm… alles Teil von Gottes Plan. Ganz bestimmt.', null, 'sssssl')
    await scene.game.state.states.head.defaultStateManager.setActiveState(Silent)

    return FishDead
  }
}

class FishDead extends SceneState<FishScene> {
  public async show() {
    const scene = this.scene
    await scene.resetScene(true)

    await scene.fish.setActiveState('dead')

    scene.fish.interactionEnabled = true

    this.listeners.push(scene.fish.events.onInputDown.addOnce(
      () => this.stateManager.trigger(CollectFish)
    ))
  }
}

class CollectFish extends SceneStateTransition<FishScene> {
  public async enter() {
    const scene = this.scene
    await scene.resetScene()

    Inventory.instance.item = Images.fish.key
    await scene.game.state.states.bard.stateManagers.meckie.setActiveState(AntoniusBroughtFish)

    return FishGone
  }
}

class FishGone extends SceneState<FishScene> {
  public async show() {
    const scene = this.scene
    await scene.resetScene(true)

    scene.fish.visible = false
  }
}
