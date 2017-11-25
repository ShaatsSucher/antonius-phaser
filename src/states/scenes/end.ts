import Scene from './scene'
import { SceneStateManager,
         SceneState,
         SceneStateTransition,
         ConditionalStateTransition,
         TransitionCondition
       } from '../../utils/stateManager'

import { Audio, CustomWebFonts, Images, Spritesheets } from '../../assets'

import Inventory from '../../overlays/inventory'
import SettingsOverlay from '../../overlays/settings'
import RestartOverlay from '../../overlays/restart'

import { ArrayUtils, StringUtils } from '../../utils/utils'

export default class EndScene extends Scene {
  image: Phaser.Sprite
  titleText: Phaser.Text

  stateManagers = {
    default: new SceneStateManager<EndScene>(this, [
      Initial,
      ThankYouForPlaying
    ], [
      YearsLater
    ])
  }

  public characters = { }
  public interactiveObjects = { }

  private textStyle = {
    font: `8px ${CustomWebFonts.pixelOperator8Bold.family}`,
    fill: '#fff',
    stroke: '#000',
    strokeThickness: 2
  }

  constructor(game: Phaser.Game) {
    super(game, '', [], Audio.musicCredits.key)
  }

  protected createGameObjects() {
    this.image = this.add.sprite(
      Math.round(this.world.width * 0.292),
      Math.round(this.world.height * 0.426),
      Images.backgroundsCraesbeeckAntonius.key
    )
    this.image.anchor.setTo(0.294, 0.489)
    this.image.scale.setTo((this.game.canvas.width - this.image.x) / (this.image.width - this.image.width * this.image.anchor.x))
    this.image.tint = 0x666666

    Inventory.instance.visible = false

    this.settingsButton.visible = false
    Inventory.instance.visible = false

    this.titleText = this.game.add.text(
      this.game.world.centerX + 0.5,
      this.game.world.centerY,
      '',
      this.textStyle
    )
    this.titleText.anchor.setTo(0.5)
  }

  create() {
    super.create()

    this.settingsButton.visible = false
    this.helpButton.visible = false
    this.inventoryButton.visible = false
  }
}

class Initial extends SceneState<EndScene> {
  public async show() {
    this.scene.settingsButton.visible = false
    this.scene.helpButton.visible = false
    this.scene.inventoryButton.visible = false

    SettingsOverlay.instance.hide()
    Inventory.instance.hide()
    RestartOverlay.instance.hide()

    this.scene.image.alpha = 0

    this.scene.titleText.text = '25 Jahre später...'
    this.scene.titleText.alpha = 1

    this.scene.wait(4).then(() => this.stateManager.trigger(YearsLater))
  }

  public async hide() {
    await super.hide()
    this.scene.settingsButton.visible = true
    this.scene.helpButton.visible = true
    this.scene.inventoryButton.visible = true
  }
}

class YearsLater extends SceneStateTransition<EndScene> {
  public async enter() {
    SettingsOverlay.instance.hide()
    Inventory.instance.hide()
    RestartOverlay.instance.hide()

    this.scene.settingsButton.visible = false
    this.scene.helpButton.visible = false
    this.scene.inventoryButton.visible = false

    const tweenAll = (to: any, ...things: any[]) => {
      return Promise.all(things
        .map(thing => this.scene.tweens.create(thing))
        .map(tween => tween.to(to, 2000).start())
        .map(tween => tween.onComplete.asPromise())
      )
    }

    await this.scene.tweens.create(this.scene.titleText).to({ alpha: 0 }, 2000).start().onComplete.asPromise()

    const { centerX, centerY } = this.scene.game.world

    const tree = new Phaser.Sprite(this.scene.game, centerX, centerY, Spritesheets.needlebeam.key)
    tree.anchor.setTo(0.5)
    tree.animations.add('waving', ArrayUtils.range(0, 7), 8, true)
    tree.animations.play('waving')
    tree.alpha = 0
    this.scene.game.add.existing(tree)

    const nailgoose = new Phaser.Sprite(this.scene.game, 230, 135, Spritesheets.nailgooseTheend.key)
    nailgoose.animations.add('raise hands', ArrayUtils.range(0, 2), 8, false)
    nailgoose.animations.add('clapping', ArrayUtils.range(3, 9), 8, true)
    nailgoose.animations.add('lower hands', [3].concat(ArrayUtils.range(10, 12)), 8, false)
    nailgoose.animations.add('hearts', ArrayUtils.range(13, 21), 8, true)
    nailgoose.alpha = 0
    this.scene.game.add.existing(nailgoose)

    await nailgoose.animations.play('raise hands').onComplete.asPromise()
    nailgoose.animations.play('clapping')

    await tweenAll({ alpha: 1 }, tree, nailgoose)

    await this.scene.wait(2)
    nailgoose.animations.currentAnim.loop = false
    await nailgoose.animations.currentAnim.onComplete.asPromise()
    await nailgoose.animations.play('lower hands').onComplete.asPromise()
    nailgoose.animations.play('hearts')
    await this.scene.wait(2)

    await tweenAll({ alpha: 0 }, tree, nailgoose)

    this.scene.titleText.text = 'Vielen Dank für\'s Spielen!'
    await tweenAll({ alpha: 1 }, this.scene.titleText, this.scene.image)

    tree.kill()

    this.scene.settingsButton.visible = true
    this.scene.helpButton.visible = true
    this.scene.inventoryButton.visible = true

    return ThankYouForPlaying
  }
}

class ThankYouForPlaying extends SceneState<EndScene> {
  public async show() {
    this.scene.settingsButton.visible = false
    this.scene.helpButton.visible = false
    this.scene.inventoryButton.visible = false

    SettingsOverlay.instance.hide()
    Inventory.instance.hide()
    RestartOverlay.instance.hide()

    this.scene.image.alpha = 1

    this.scene.titleText.text = 'Vielen Dank für\'s Spielen!'
    this.scene.titleText.alpha = 1

    await this.scene.wait(5)

    this.scene.game.camera.onFadeComplete.addOnce(() => {
      this.scene.game.state.start('reset')
    })
    this.scene.game.camera.fade(0x000000, 5000)
  }

  public async hide() {
    await super.hide()
    this.scene.settingsButton.visible = true
    this.scene.helpButton.visible = true
    this.scene.inventoryButton.visible = true
  }
}
