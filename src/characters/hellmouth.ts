import * as Assets from '../assets'
import Character from './character'
import CharacterState from './characterState'
import { ArrayUtils, StringUtils } from '../utils/utils'
import SpeechHelper from '../utils/speechHelper'

export default class HellmouthCharacter extends Character {
  public speech = new SpeechHelper(this, 0, 0, SpeechHelper.Generators.random(
    ArrayUtils.range(1, 38).map(i =>
      Assets.Audio[`hellmouth${StringUtils.intToString(i, 3)}`].key
    )
  ))

  constructor(game: Phaser.Game, x: number, y: number) {
    super(game, x, y, Assets.Spritesheets.hellmouthTalkcycle.key)

    this.animations.add('idle', [0], 0, false)
    this.animations.add('talking', null, 16, true)
    this.animations.add('open mouth', ArrayUtils.range(0, 9), 16, false)
    this.animations.add('close mouth', ArrayUtils.range(10, 17), 16, false)

    this.addCharacterState('idle', new IdleState(this))
    this.addCharacterState('talking', new TalkingState(this))
    this.addCharacterState('open mouth', new OpenMouthState(this))
    this.addCharacterState('close mouth', new CloseMouthState(this))

    this.play('idle')
  }
}

class IdleState implements CharacterState<HellmouthCharacter> {
  constructor(public character: HellmouthCharacter) { }

  async enter() {
    this.character.play('idle')
  }
}

class TalkingState implements CharacterState<HellmouthCharacter> {
  constructor(public character: HellmouthCharacter) { }

  async enter() {
    this.character.animations.stop() // reset animation if necessary
    const anim = this.character.play('talking')
  }
}

class OpenMouthState implements CharacterState<HellmouthCharacter> {
  constructor(public character: HellmouthCharacter) { }

  async enter() {
    this.character.animations.stop()
    const anim = this.character.play('open mouth')
    let animDoneCb
    const animDone = new Promise(resolve => { animDoneCb = resolve })
    anim.onComplete.addOnce(animDoneCb)
    await animDone
  }
}

class CloseMouthState implements CharacterState<HellmouthCharacter> {
  constructor(public character: HellmouthCharacter) { }

  async enter() {
    this.character.animations.stop()
    const anim = this.character.play('close mouth')
    anim.onComplete.addOnce(() => {
      this.character.setActiveState('idle')
    })
  }
}
