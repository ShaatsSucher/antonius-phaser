import * as Assets from '../assets'
import * as AssetUtils from '../utils/assetUtils'

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
    this.game.camera.onFadeComplete.addOnce(this.loadTitle, this)
    this.game.camera.fade(0x000000, 1000)
  }

  private loadTitle(): void {
    this.game.state.start('head')
  }
}
