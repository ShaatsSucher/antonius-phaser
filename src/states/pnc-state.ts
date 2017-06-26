export default class PnCState extends Phaser.State {
  private backgroundSpriteName: string
  private backgroundSprite: Phaser.Sprite
  protected navigationSprites: [Phaser.Sprite, boolean][]

  constructor(background: string) {
    super()
    this.backgroundSpriteName = background
  }

  public create(): void {
    this.backgroundSprite = this.game.add.sprite(0, 0, this.backgroundSpriteName)
  }

  public lockNavigation(): void {
    this.navigationSprites.forEach(sprite => {
      sprite[1] = sprite[0].inputEnabled
      sprite[0].inputEnabled = false
    })
  }

  public unlockNavigation(): void {
    this.navigationSprites.forEach(sprite => {
      sprite[0].inputEnabled = sprite[1]
    })
  }
}
