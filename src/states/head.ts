import * as Assets from '../assets'
import PnCState from './pnc-state'
import ArrayUtils from '../utils/arrayUtils'
import StringUtils from '../utils/stringUtils'

export default class HeadSceneState extends PnCState {
  protected hellmouthSprite: Phaser.Sprite = null
  protected hellmouthSamples: string[] = []

  protected antonius: Phaser.Sprite = null


  constructor() {
    super(Assets.Images.ImagesBackgroundHead.key)
  }

  public init(): void {

  }

  public create(): void {
    super.create()

    this.hellmouthSprite = this.game.add.sprite(135, 40, Assets.Spritesheets.SpritesheetsHellmouthTalkcycle.key)
    this.hellmouthSprite.animations.add('talk')
    this.hellmouthSprite.inputEnabled = true
    this.hellmouthSprite.input.useHandCursor = true
    this.hellmouthSprite.events.onInputDown.add(() => {
      this.hellmouthSprite.inputEnabled = false
      this.game.canvas.style.cursor = 'default'

      this.hellmouthSprite.animations.play('talk', 16, true)

      let talkCount: number = 0
      playRandomSound(this.hellmouthSamples, () => talkCount++ < 3, () => {
        this.hellmouthSprite.inputEnabled = true
        this.hellmouthSprite.input.useHandCursor = true
        this.hellmouthSprite.animations.stop()
        this.hellmouthSprite.frame = 0
      })
    })

    this.hellmouthSamples = ArrayUtils.range(1, 38).map(i =>
      Assets.Audio[`AudioHellmouth${StringUtils.intToString(i, 3)}`].key
    )

    const self = this
    function playRandomSound(sounds: string[], playWhile: () => boolean, done = (() => {}) , lastSound?: string) {
      const availableSounds = lastSound ? sounds.slice(0, sounds.indexOf(lastSound)).concat(sounds.slice(sounds.indexOf(lastSound) + 1)) : sounds
      const nextSound = Phaser.ArrayUtils.getRandomItem(availableSounds)
      self.game.sound.play(nextSound).onStop.addOnce(() => {
        if (playWhile()) {
          playRandomSound(sounds, playWhile, done, nextSound)
        } else {
          done()
        }
      })
    }

    this.antonius = this.game.add.sprite(258, 120, Assets.Spritesheets.SpritesheetsAntoniusTalkcycle.key)
    this.antonius.scale = new Phaser.Point(2, 2)

    this.game.camera.flash(0x000000, 1000)
  }
}

class HeadSceneIntroState extends HeadSceneState {

}
