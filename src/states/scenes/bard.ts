import Scene from './scene'
import SceneState from './sceneState'

import * as Assets from '../../assets'

import AntoniusCharacter from '../../characters/antonius'
import BardCharacter from '../../characters/bard'
import GooseCharacter from '../../characters/goose'
import CatCharacter from '../../characters/cat'

import SheechHelper from '../../utils/speechHelper'

import { ArrayUtils, StringUtils } from '../../utils/utils'

export default class BardScene extends Scene {
  private goose: GooseCharacter
  private bard: BardCharacter
  private cat: CatCharacter

  private antonius: AntoniusCharacter

  constructor() {
    super(
      Assets.Images.backgroundsBard.key,
      InitialState
    )
  }

  protected createGameObjects() {
    const goose = this.goose = new GooseCharacter(this.game, 48, 10)
    goose.scale = new Phaser.Point(3, 3)
    goose.setActiveState('idle')
    this.add.existing(goose)

    const bard = this.bard = new BardCharacter(this.game, 48, 10)
    bard.scale = new Phaser.Point(3, 3)
    bard.setActiveState('idle')
    this.add.existing(bard)

    const cat = this.cat = new CatCharacter(this.game, 48, 10)
    cat.scale = new Phaser.Point(3, 3)
    cat.setActiveState('idle')
    this.add.existing(cat)

    const antonius = this.antonius = new AntoniusCharacter(this.game, 292, 120)
    antonius.scale = new Phaser.Point(3, 3)
    antonius.setActiveState('idle')
    this.add.existing(antonius)
  }
}

class InitialState implements SceneState<BardScene> {
  constructor(public readonly scene: BardScene) { }
  public getStateName() { return 'initial' }

  public async enter(): Promise<void> {
  }
}
