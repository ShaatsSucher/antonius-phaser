export default class GameObject extends Phaser.Sprite {
  private _interactionEnabled: boolean

  public onUpdate = new Phaser.Signal()

  public set interactionEnabled(value: boolean) {
    this.setInteractionEnabled(value)
  }

  public get interactionEnabled() {
    return this._interactionEnabled
  }

  public update() {
    this.onUpdate.dispatch()
  }

  public setInteractionEnabled(value: boolean) {
    this._interactionEnabled = value
    this.inputEnabled = value
    // const mouseHoversChar = this.getBounds().contains(this.input.pointerX(0), this.input.pointerY(0))
    // if (value) {
    //   this.input.useHandCursor = true
    // }
    // this.game.canvas.style.cursor = mouseHoversChar && this.interactionEnabled
    //   ? 'pointer'
    //   : 'default'
    this.input.pixelPerfectOver = value
    this.input.pixelPerfectClick = value
    this.input.useHandCursor = value
  }
}
