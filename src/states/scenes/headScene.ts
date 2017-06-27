import * as Assets from '../../assets'

import HellmouthCharacter from '../../characters/hellmouth'
import AntoniusCharacter from '../../characters/antonius'

import SheechHelper from '../../utils/speechHelper'

import ArrayUtils from '../../utils/arrayUtils'
import StringUtils from '../../utils/stringUtils'

export default class HeadScene extends Phaser.State {
  private hellmouth: HellmouthCharacter = null
  private antonius: AntoniusCharacter = null

  public create(): void {
    // Add background
    this.game.add.sprite(0, 0, Assets.Images.ImagesBackgroundHead.key)

    // Add hellmouth
    const hellmouth = this.hellmouth = new HellmouthCharacter(this.game, 135, 40)
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

    // Add antonius
    const antonius = this.antonius = new AntoniusCharacter(this.game, 258, 120)
    this.game.add.existing(antonius)
    antonius.scale = new Phaser.Point(2, 2)

    function makeAntoniusTalk() {
      antonius.inputEnabled = true
      antonius.input.useHandCursor = true
      antonius.speechPattern = Phaser.ArrayUtils.getRandomItem([
        'slslsl',
        'sllslsl',
        'llssll',
        'sssssssssl'
      ])
      console.log(antonius.speechPattern)
      antonius.events.onInputDown.addOnce(() => {
        antonius.inputEnabled = false
        self.game.canvas.style.cursor = 'default'
        antonius.speech.say('hello', null, null, async () => {
          antonius.setActiveState('talking')
        })
        .then(() => antonius.setActiveState('idle'))
        .then(makeAntoniusTalk)
      })
    }
    makeAntoniusTalk()

    // Fade in from black over one second
    this.game.camera.flash(0x000000, 1000)
  }
}
