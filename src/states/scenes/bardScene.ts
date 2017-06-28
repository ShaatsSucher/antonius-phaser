import * as Assets from '../../assets'

import AntoniusCharacter from '../../characters/antonius'
import BardCharacter from '../../characters/bard'
import GooseCharacter from '../../characters/goose'

import SheechHelper from '../../utils/speechHelper'

import ArrayUtils from '../../utils/arrayUtils'
import StringUtils from '../../utils/stringUtils'

export default class BardScene extends Phaser.State {
  private goose: GooseCharacter
  private bard: BardCharacter
  private antonius: AntoniusCharacter

  public create(): void {
    // Add background
    this.game.add.sprite(0, 0, Assets.Images.ImagesBackgroundBard.key)

    const goose = this.goose = new GooseCharacter(this.game, 48, 10)
    goose.scale = new Phaser.Point(3, 3)
    this.game.add.existing(goose)

    const bard = this.bard = new BardCharacter(this.game, 48, 10)
    bard.scale = new Phaser.Point(3, 3)
    this.game.add.existing(bard)

    const antonius = this.antonius = new AntoniusCharacter(this.game, 292, 120)
    antonius.scale = new Phaser.Point(3, 3)
    this.game.add.existing(antonius)

    bard.setActiveState('walking')
    goose.setActiveState('walking')
    antonius.setActiveState('talking')

    // Fade in from black over one second
    this.game.camera.flash(0x000000, 1000)
  }
}
