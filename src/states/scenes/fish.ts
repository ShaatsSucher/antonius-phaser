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
  public characters = {
    antonius: null,
    fish: null
  }

  public interactiveObjects = {
    toHeadArrow: null,
    toKitchenArrow: null
  }

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

  constructor(game: Phaser.Game) {
    super(
      game,
      Images.backgroundsFish.key,
      Audio.soundscapesScene9.key,
      Audio.musicHeadScreen.key
    )
  }

  protected createGameObjects() {
    // Add navigation arrows
    const toHeadArrow = this.interactiveObjects.toHeadArrow = new Arrow(this.game, 190, 20)
    toHeadArrow.rotation = - Math.PI / 2
    toHeadArrow.interactionEnabled = true
    this.game.add.existing(toHeadArrow)
    toHeadArrow.events.onInputDown.addOnce(() => {
      toHeadArrow.interactionEnabled = false
      this.fadeTo('head')
    })

    const toKitchenArrow = this.interactiveObjects.toKitchenArrow = new Arrow(this.game, 364, 108)
    toKitchenArrow.interactionEnabled = true
    this.game.add.existing(toKitchenArrow)
    toKitchenArrow.events.onInputDown.addOnce(() => {
      toKitchenArrow.interactionEnabled = false
      this.fadeTo('kitchen')
    })

    // Add antonius
    const antonius = this.characters.antonius = new AntoniusCharacter(this.game, 270, 120)
    antonius.scale = new Phaser.Point(3, 3)
    antonius.setActiveState('idle')
    this.game.add.existing(antonius)

    const fish = this.characters.fish = new FishCharacter(this.game, 150, 120)
    fish.scale = new Phaser.Point(3, 3)
    this.game.add.existing(fish)
  }

  async resetScene(showArrows = false) {
    this.interactiveObjects.toHeadArrow.visible = showArrows

    this.characters.fish.interactionEnabled = false
    this.characters.antonius.interactionEnabled = false

    await this.characters.fish.setActiveState('idle')
    await this.characters.antonius.setActiveState('idle')
  }
}

class Initial extends SceneState<FishScene> {
  public async show() {
    const scene = this.scene
    await scene.resetScene(true)

    scene.characters.fish.interactionEnabled = true

    this.listeners.push(scene.characters.fish.events.onInputUp.addOnce(
      () => this.stateManager.trigger(FishConversation))
    )
  }
}

class FishConversation extends SceneStateTransition<FishScene> {
  public async enter() {
    const scene = this.scene
    await scene.resetScene()

    await scene.characters.antonius.speech.say('Ach, ich dachte doch\nirgendwas riecht hier fischig', null, 'ssslsss')
    await scene.characters.fish.speech.say('Ent-schul-di-gung, aber was so "fischig"\nriecht ist ein Canal No. 5!', 10)
    await scene.characters.antonius.speech.say('Oh, du sprichst!', null, 'lss')
    await scene.characters.fish.speech.say('Nicht nur spreche ich, ich atme Luft!\nWasser ist ja *schnauf* so was von altmodisch.', 8)
    await scene.characters.fish.speech.say('Frischluft, *röchel* das atmet man heutzutage!', 6)
    await scene.characters.antonius.speech.say('Sicher, dass es dir gut geht?\nDu siehst ein bisschen blass um die Kiemen aus...', null, 'ssslsls')

    return ImFine
  }
}

class ImFine extends SceneStateTransition<FishScene> {
  public async enter() {
    const scene = this.scene
    await scene.resetScene()

    await scene.characters.fish.speech.say('Mir geht es *keuch* BLEN-DEND!', 5)

    return FishAlive
  }
}

export class FishAlive extends SceneState<FishScene> {
  public async show() {
    const scene = this.scene
    await scene.resetScene(true)

    scene.characters.fish.interactionEnabled = true

    this.listeners.push(scene.characters.fish.events.onInputUp.addOnce(
      () => this.stateManager.trigger(ImFine))
    )
  }
}

export class FishDying extends SceneState<FishScene> {
  public async show() {
    const scene = this.scene
    await scene.resetScene(true)

    scene.characters.fish.interactionEnabled = true

    this.listeners.push(scene.characters.fish.events.onInputDown.addOnce(
      () => this.stateManager.trigger(Suffocation)
    ))
  }
}

class Suffocation extends SceneStateTransition<FishScene> {
  public async enter() {
    const scene = this.scene
    await scene.resetScene()

    await scene.characters.fish.speech.say('Luft atmen ist *japs* gesund!', 4)
    await scene.characters.fish.speech.say('Es verjüngt die Haut, es reinigt die Poren,\nalles dank der Lunge!', 6)
    await scene.characters.fish.speech.say('... Moment, hab ich eigentlich eine Lunge?', 5)

    await scene.characters.fish.setActiveState('dying')
    const deathSound = scene.sound.play(Audio.fishFishDiesFishDies.key)

    let soundDoneCallback: () => void
    const soundDone = new Promise<void>(resolve => { soundDoneCallback = resolve })
    deathSound.onStop.addOnce(soundDoneCallback)

    await soundDone

    await scene.characters.antonius.speech.say('Hmm… alles Teil von Gottes Plan. Ganz bestimmt.', null, 'sssssl')
    await scene.game.state.states.head.defaultStateManager.setActiveState(Silent)

    return FishDead
  }
}

class FishDead extends SceneState<FishScene> {
  public async show() {
    const scene = this.scene
    await scene.resetScene(true)

    await scene.characters.fish.setActiveState('dead')

    scene.characters.fish.interactionEnabled = true

    this.listeners.push(scene.characters.fish.events.onInputDown.addOnce(
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

    scene.characters.fish.visible = false
  }
}
