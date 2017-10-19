import * as Assets from '../assets'
import * as AssetUtils from '../utils/assetUtils'

import IntroScene from './scenes/intro'
import HeadScene from './scenes/head'
import BardScene from './scenes/bard'
import FishScene from './scenes/fish'
import KitchenScene from './scenes/kitchen'
import TreeScene from './scenes/tree'
import ForeheadScene from './scenes/forehead'
import ConcertScene from './scenes/concert'
import CanopyScene from './scenes/canopy'
import SeaScene from './scenes/sea'
import CaveScene from './scenes/cave'
import EndScene from './scenes/end'

import SettingsOverlay from '../overlays/settings'
import Inventory from '../overlays/inventory'
import { AudioManager } from '../utils/audioManager'

export default class Preloader extends Phaser.State {
  private preloadBarSprite: Phaser.Sprite = null
  private preloadFrameSprite: Phaser.Sprite = null

  public preload(): void {
    this.preloadBarSprite = this.game.add.sprite(
      this.game.world.centerX, this.game.world.centerY,
      Assets.Atlases.preloadSprite.key,
      Assets.Atlases.preloadSprite.frames.preloadBar)
    this.preloadBarSprite.anchor.setTo(0, 0.5)
    this.preloadBarSprite.x -= this.preloadBarSprite.width / 2

    this.preloadFrameSprite = this.game.add.sprite(
      this.game.world.centerX, this.game.world.centerY,
      Assets.Atlases.preloadSprite.key,
      Assets.Atlases.preloadSprite.frames.preloadFrame)
    this.preloadFrameSprite.anchor.setTo(0, 0.5)
    this.preloadFrameSprite.x -= this.preloadFrameSprite.width / 2

    this.game.load.setPreloadSprite(this.preloadBarSprite)

    AssetUtils.Loader.loadAllAssets(this.game, this.waitForSoundDecoding, this)
  }

  private waitForSoundDecoding(): void {
    AssetUtils.Loader.waitForSoundDecoding(this.startGame, this)
  }

  private startGame(): void {
    this.state.add('intro', IntroScene)
    this.state.add('head', HeadScene)
    this.state.add('bard', BardScene)
    this.state.add('fish', FishScene)
    this.state.add('kitchen', KitchenScene)
    this.state.add('tree', TreeScene)
    this.state.add('forehead', ForeheadScene)
    this.state.add('concert', ConcertScene)
    this.state.add('canopy', CanopyScene)
    this.state.add('sea', SeaScene)
    this.state.add('cave', CaveScene)
    this.state.add('end', EndScene)

    Object.keys(this.state.states)
      .map(key => this.state.states[key])
      .filter(scene => scene && scene.registerConditionalStateTransitions)
      .forEach(scene => scene.registerConditionalStateTransitions(this.state.states))

    SettingsOverlay.init(this.game)
    Inventory.init(this.game)
    AudioManager.init(this.game.sound)

    this.game.camera.onFadeComplete.addOnce(this.loadTitle, this)
    this.game.camera.fade(0x000000, 1000)
  }

  private loadTitle(): void {
    this.game.state.start('intro')
  }
}
