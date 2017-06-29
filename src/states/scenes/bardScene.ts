import * as Assets from '../../assets'

import AntoniusCharacter from '../../characters/antonius'
import BardCharacter from '../../characters/bard'
import GooseCharacter from '../../characters/goose'
import CatCharacter from '../../characters/cat'

import SheechHelper from '../../utils/speechHelper'

import ArrayUtils from '../../utils/arrayUtils'
import StringUtils from '../../utils/stringUtils'

export default class BardScene extends Phaser.State {
  private goose: GooseCharacter
  private bard: BardCharacter
  private cat: CatCharacter

  private antonius: AntoniusCharacter

  public create(): void {
    // Add background
    this.add.sprite(0, 0, Assets.Images.backgroundBard.key)

    const goose = this.goose = new GooseCharacter(this.game, 48, 10)
    goose.scale = new Phaser.Point(3, 3)
    this.add.existing(goose)

    const bard = this.bard = new BardCharacter(this.game, 48, 10)
    bard.scale = new Phaser.Point(3, 3)
    this.add.existing(bard)

    const cat = this.cat = new CatCharacter(this.game, 48, 10)
    cat.scale = new Phaser.Point(3, 3)
    this.add.existing(cat)

    const antonius = this.antonius = new AntoniusCharacter(this.game, 292, 120)
    antonius.scale = new Phaser.Point(3, 3)
    this.add.existing(antonius)

    bard.setActiveState('idle')
    goose.setActiveState('idle')
    cat.setActiveState('idle')

    antonius.setActiveState('idle')

    // Fade in from black over one second
    this.camera.flash(0x000000, 1000)
  }
}
