import * as Assets from '../assets'

import HellmouthCharacter from '../characters/hellmouth'

import SheechHelper from '../utils/speechHelper'

import ArrayUtils from '../utils/arrayUtils'
import StringUtils from '../utils/stringUtils'

export default class HeadSceneState extends Phaser.State {
  protected hellmouthSprite: Phaser.Sprite = null
  protected hellmouthSamples: string[] = ArrayUtils.range(1, 38).map(i =>
    Assets.Audio[`AudioHellmouth${StringUtils.intToString(i, 3)}`].key
  )

  protected antonius: Phaser.Sprite = null


  constructor() {
    super(Assets.Images.ImagesBackgroundHead.key)
  }

  public init(): void {

  }

  public create(): void {
    // Add background
    this.game.add.sprite(0, 0, Assets.Images.ImagesBackgroundHead.key)

    const hellmouth = new HellmouthCharacter(this.game, 135, 40)
    this.game.add.existing(hellmouth)

    const self = this
    function makeMouthTalk() {
      hellmouth.inputEnabled = true
      hellmouth.input.useHandCursor = true
      hellmouth.events.onInputDown.addOnce(() => {
        hellmouth.inputEnabled = false
        self.game.canvas.style.cursor = 'default'
        hellmouth.speech.say('hello', 2, null, async () => {
          hellmouth.setActiveState('talking')
        })
        .then(() => hellmouth.setActiveState('idle'))
        .then(makeMouthTalk)
      })
    }
    makeMouthTalk()

    this.antonius = this.game.add.sprite(258, 120, Assets.Spritesheets.SpritesheetsAntoniusTalkcycle.key)
    this.antonius.scale = new Phaser.Point(2, 2)

    // Fade in from black over one second
    this.game.camera.flash(0x000000, 1000)
  }
}
