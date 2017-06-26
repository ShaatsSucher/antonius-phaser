import * as Assets from '../assets'

export default class Title extends Phaser.State {
  private backgroundTemplateSprite: Phaser.Sprite = null
  private googleFontText: Phaser.Text = null
  private localFontText: Phaser.Text = null
  private pixelateShader: Phaser.Filter = null
  private bitmapFontText: Phaser.BitmapText = null
  private blurXFilter: Phaser.Filter.BlurX = null
  private blurYFilter: Phaser.Filter.BlurY = null
  private sfxAudiosprite: Phaser.AudioSprite = null
  private mummySpritesheet: Phaser.Sprite = null

  // This is any[] not string[] due to a limitation in TypeScript at the moment
  // despite string enums working just fine, they are not officially supported so we trick the compiler into letting us do it anyway.
  private sfxLaserSounds: any[] = null

  public create(): void {
    this.game.camera.flash(0xffffff, 1000)
  }
}
