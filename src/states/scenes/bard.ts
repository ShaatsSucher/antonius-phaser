import Scene from './scene'
import { SceneStateManager, SceneState, SceneStateTransition } from '../../utils/stateManager'

import { FishHintAvailable, Suction } from './head'
import { FishAlive, FishDying } from './fish'

import { Audio, Images } from '../../assets'

import AntoniusCharacter from '../../characters/antonius'
import BardCharacter from '../../characters/bard'
import GooseCharacter from '../../characters/goose'
import CatCharacter from '../../characters/cat'
import MeckieCharacter from '../../characters/meckie'

import Arrow from '../../gameObjects/arrow'

import SheechHelper from '../../utils/speechHelper'

import Inventory from '../../overlays/inventory'
import { ArrayUtils, StringUtils, TimeUtils } from '../../utils/utils'

export default class BardScene extends Scene {
  goose: GooseCharacter
  bard: BardCharacter
  cat: CatCharacter
  meckie: MeckieCharacter

  antonius: AntoniusCharacter

  toHeadArrow: Arrow

  readonly stateManagers: { [name: string]: SceneStateManager<BardScene> } = {
    bard: new SceneStateManager<BardScene>(this, [
      InitialBard,
      CatInTheWay,
      CatGone,
      FiletInThePocket,
      BardGone
    ], [
      BardConversation,
      AnnoyedCat,
      SadBard,
      CatFeast,
      HelloThere
    ]),
    meckie: new SceneStateManager<BardScene>(this, [
      InitialMeckie,
      AntoniusBroughtFish,
      WaitingForFish,
      FishCut
    ], [
      MeckieIntroduction,
      MeckieRequest,
      CutFish
    ])
  }

  constructor() {
    super(Images.backgroundsBard.key)

    function exceptFirst(closure: () => any) {
      let first = true
      return () => {
        if (first) {
          first = false
          return
        }
        closure()
      }
    }

    // Make sure the character of both statemachines are always displayed
    // correctly.
    this.stateManagers.bard.onActiveStateChanged.add(exceptFirst(() =>
      this.stateManagers.meckie.reenter()
    ))
    this.stateManagers.meckie.onActiveStateChanged.add(exceptFirst(() =>
      this.stateManagers.bard.reenter()
    ))
  }

  protected createGameObjects() {
    const goose = this.goose = new GooseCharacter(this.game, 144, 10)
    goose.scale = new Phaser.Point(3, 3)
    goose.anchor.setTo(0.5, 0)
    goose.setActiveState('idle')
    this.add.existing(goose)

    const bard = this.bard = new BardCharacter(this.game, 144, 10)
    bard.scale = new Phaser.Point(3, 3)
    bard.anchor.setTo(0.5, 0)
    bard.setActiveState('idle')
    this.add.existing(bard)

    const cat = this.cat = new CatCharacter(this.game, 144, 64)
    cat.scale = new Phaser.Point(3, 3)
    cat.anchor.setTo(0.5, 0)
    cat.setActiveState('idle')
    this.add.existing(cat)

    const meckie = this.meckie = new MeckieCharacter(this.game, 78, 120)
    meckie.scale = new Phaser.Point(3, 3)
    meckie.anchor.setTo(0.5, 0)
    meckie.setActiveState('idle')
    this.add.existing(meckie)

    const antonius = this.antonius = new AntoniusCharacter(this.game, 292, 120)
    antonius.scale = new Phaser.Point(3, 3)
    antonius.setActiveState('idle')
    this.add.existing(antonius)

    const arrow = this.toHeadArrow = new Arrow(this.game, 20, 95)
    arrow.rotation = Math.PI
    arrow.interactionEnabled = true
    this.game.add.existing(arrow)
    arrow.events.onInputDown.addOnce(() => {
      arrow.interactionEnabled = false
      this.fadeTo('head')
    })
  }

  async resetScene(showArrows = false) {
    this.playAtmo(Audio.soundscapesScreen2.key)
    this.playMusic(Audio.musicBardScreen.key)

    this.toHeadArrow.visible = showArrows

    this.antonius.interactionEnabled = false

    await this.antonius.setActiveState('idle')
  }

  async resetBardRelated() {
    this.goose.interactionEnabled = false
    this.bard.interactionEnabled = false
    this.cat.interactionEnabled = false

    await this.goose.setActiveState('idle')
    await this.bard.setActiveState('idle')
    await this.cat.setActiveState('idle')
  }

  async resetMeckieRelated() {
    this.meckie.interactionEnabled = false

    await this.meckie.setActiveState('idle')
  }

  async resetAll(showArrows = false) {
    await this.resetScene(showArrows)
    await this.resetBardRelated()
    await this.resetMeckieRelated()
  }
}

class InitialBard extends SceneState<BardScene> {
  public async show() {
    const scene = this.scene
    await scene.resetScene(true)
    await scene.resetBardRelated()

    scene.killBackgroundSound('music')

    scene.bard.interactionEnabled = true

    this.listeners.push(scene.bard.events.onInputUp.addOnce(
      () => scene.stateManagers.bard.trigger(BardConversation)
    ))
  }
}

class BardConversation extends SceneStateTransition<BardScene> {
  public async enter() {
    const scene = this.scene
    await scene.resetAll()
    scene.killBackgroundSound('music')

    scene.bard.setActiveState('singing')
    scene.bard.interactionEnabled = true
    const bardSong = scene.sound.play(Audio.bardSongShort.key)
    bardSong.onStop.addOnce(() => { scene.bard.setActiveState('idle') })

    const clickedAnywhere = new Promise<void>(resolve => {
      this.scene.game.input.mouse.capture = true
      let mouseWasUp = false
      let mouseWasDown = false
      let handle: Phaser.SignalBinding
      handle = this.scene.onUpdate.add(() => {
        if (!this.scene.game.input.activePointer.leftButton.isDown) {
          mouseWasUp = true
        }
        if (mouseWasUp && this.scene.game.input.activePointer.leftButton.isDown) {
          mouseWasDown = true
        }
        if (mouseWasDown && !this.scene.game.input.activePointer.leftButton.isDown) {
          this.scene.game.input.mouse.capture = false
          handle.detach()
          resolve()
        }
      })
    })

    await clickedAnywhere
    bardSong.stop()
    scene.bard.setInteractionEnabled(false)

    await scene.goose.speech.say('Ach du meine Güte.\n Wie theatralisch!', 3)
    await scene.antonius.speech.say('Ihr da, auf dem fantastischen Reitwesen!', null, 'slssls')
    await scene.antonius.speech.say('Dieses Lied klingt so unendlich einsam,\nwarum seid Ihr so traurig?', null, 'ssssssss')
    await scene.bard.speech.say('Hört mir denn keiner zu?\nIch vermisse meine Freundin,\ndie Reitgans, sehr!', 10)
    await scene.goose.speech.say('So weit sind wir ja nicht von einander entfernt...', 6)
    await scene.antonius.speech.say('Stimmt, soweit seid ihr doch\nnicht voneinander entfernt.', null, 'sssssss')
    await scene.antonius.speech.say('Dreht euch doch ein mal um.', null, 'ssl')
    await scene.bard.speech.say('Das geht nicht. Da ist etwas hinter mir!', 6)
    await scene.antonius.speech.say('Ich sehe das Problem.\nVielleicht kann ich helfen.', null, 'ssssss')

    await scene.game.state.states.head.defaultStateManager.setActiveState(FishHintAvailable)

    return CatInTheWay
  }
}

class CatInTheWay extends SceneState<BardScene> {
  public async show() {
    const scene = this.scene
    await scene.resetScene(true)
    await scene.resetBardRelated()
    scene.cat.interactionEnabled = true
    this.listeners.push(scene.cat.events.onInputUp.addOnce(
      () => scene.stateManagers.bard.trigger(AnnoyedCat)
    ))

    scene.bard.interactionEnabled = true
    this.listeners.push(scene.bard.events.onInputUp.addOnce(
      () => scene.stateManagers.bard.trigger(SadBard)
    ))
  }
}

class AnnoyedCat extends SceneStateTransition<BardScene> {
  public async enter() {
    const scene = this.scene
    await scene.resetAll()
    await scene.cat.speech.say('[genervtes Miauen]', 4.9)
    await scene.antonius.speech.say('Das wird wohl schwieriger als gedacht...', null, 'sssssl')

    return CatInTheWay
  }
}

class SadBard extends SceneStateTransition<BardScene> {
  public async enter() {
    const scene = this.scene
    await scene.resetAll()
    await scene.bard.speech.say('*seufz*', 2, 'practice')
    await scene.goose.speech.say(Phaser.ArrayUtils.getRandomItem([
      'Oh Mann...',
      'Wann hört das auf?',
      'Meine Nerven!'
    ]), 2)

    return CatInTheWay
  }
}

class FiletInThePocket extends SceneState<BardScene> {
  public async show() {
    const scene = this.scene
    await scene.resetScene(true)
    await scene.resetBardRelated()

    scene.cat.interactionEnabled = true
    this.clearListeners()
    this.listeners.push(scene.cat.events.onInputUp.addOnce(
      () => { this.stateManager.trigger(CatFeast) }
    ))
  }
}

class CatFeast extends SceneStateTransition<BardScene> {
  public async enter() {
    const scene = this.scene
    await scene.resetAll()

    await scene.antonius.speech.say('Hier, Miez!\nIch hab einen Fisch für dich.', null, 'llsssslsl')
    await scene.cat.speech.say('...', 1, 'silent')
    await scene.antonius.speech.say('Komm, hol dir einen leckeren Fisch!', null, 'lsssssssl')
    await scene.cat.speech.say('...', 1, 'silent')
    await TimeUtils.wait(0.5)
    Inventory.instance.item = ''
    await TimeUtils.wait(0.5)
    await scene.cat.speech.say('... Angemessen.', 1, 'silent', Audio.catCatAccepts.key)
    await scene.antonius.speech.say('...', null, '')
    await scene.antonius.speech.say('Was?', null, 'l')

    scene.game.tweens.create(scene.cat).to({
      y: 150
    }, 500, i => (1 + 2 / 3) * i * i - (2 / 3) * i).start().onComplete.addOnce(() => {
      scene.cat.scale.x =  -3
      scene.cat.setActiveState('walking')
      scene.game.tweens.create(scene.cat).to({
        x: -Math.abs(scene.cat.width * scene.cat.anchor.x)
      }, 3000).start()
    })

    await TimeUtils.wait(3.5)

    return CatGone
  }
}

class CatGone extends SceneState<BardScene> {
  public async show() {
    const scene = this.scene
    await scene.resetScene(true)
    await scene.resetBardRelated()

    scene.cat.visible = false
    scene.bard.interactionEnabled = true
    this.listeners.push(scene.bard.events.onInputUp.addOnce(
      () => this.stateManager.trigger(HelloThere)
    ))
  }
}

class HelloThere extends SceneStateTransition<BardScene> {
  public async enter() {
    const scene = this.scene
    await scene.resetAll()

    scene.cat.visible = false

    await scene.bard.speech.say('Oh! Was für ein sonderbares Gefühl!', 3)
    await scene.bard.speech.say('Als hätte sich eine Blockade\nvon meinem Rücken gelöst!', 5)
    await scene.bard.speech.say('Was war das für eine schreckliche Last,\ndie soeben verschwunden ist?', 5)
    scene.bard.scale.x = -3
    scene.bard.x = 124
    scene.bard.y = 7
    await TimeUtils.wait(0.5)
    await scene.bard.speech.say('Ach da bist du ja, Reitgans!', 3)
    await scene.goose.speech.say('... Ja, da bin ich.\nSchon die ganze Zeit.', 4)
    await scene.bard.speech.say('Oh, du wirst nicht glauben,\nwie lange ich nach dir gesucht habe!', 5)
    await scene.goose.speech.say('Ich kann\'s mir vorstellen.', 3)
    await scene.bard.speech.say('Komm, lass uns nach Hause gehen!', 3)
    scene.bard.scale.x = 3
    scene.bard.x = 164
    scene.goose.scale.x = -3
    scene.bard.setActiveState('walking')
    scene.goose.setActiveState('walking')

    // This is a hacky way to make the goose only move while it is jumping.
    // (Frames 1 through 4: on the ground. Frames 5 through 7: in the air.)
    // Doesn't always work in reality, since it is not actually synced with the
    // animation, so depending on timing issues, the movement looks better or
    // worse.
    const interpolate = t => {
      if (t < 4 / 7 / 3) return 0
      if (t < 1 / 3) return t * 7 / 3 - 4 / 9
      if (t < 11 / 7 / 3) return 1 / 3
      if (t < 2 / 3) return t * 7 / 3 - 8 / 9
      if (t < 18 / 7 / 3) return 2 / 3
      return t * 7 / 3 - 12 / 9
    }

    const xmin = -Math.abs((1 - scene.goose.anchor.x) * scene.goose.width)
    scene.game.tweens.create(scene.goose).to({ x: xmin }, 3000, interpolate).start()
    scene.game.tweens.create(scene.bard).to({ x: xmin }, 3000, interpolate).start()

    await TimeUtils.wait(3)

    return BardGone
  }
}

class BardGone extends SceneState<BardScene> {
  public async show() {
    const scene = this.scene
    await scene.resetScene()
    await scene.resetBardRelated()

    scene.cat.visible = false
    scene.goose.visible = false
    scene.bard.visible = false

    await scene.game.state.states.head.defaultStateManager.setActiveState(Suction)
  }
}



class InitialMeckie extends SceneState<BardScene> {
  public async show() {
    const scene = this.scene
    await scene.resetScene(true)
    await scene.resetMeckieRelated()

    scene.meckie.interactionEnabled = true
    this.listeners.push(scene.meckie.events.onInputUp.addOnce(
      () => this.stateManager.trigger(MeckieIntroduction)
    ))
  }
}

class MeckieIntroduction extends SceneStateTransition<BardScene> {
  public async enter() {
    const scene = this.scene
    await scene.resetAll()

    await scene.meckie.speech.say('Schnibbel schnabbel schnapp!\nIch schneid dir die Kapuze ab!', null, 'sssslsll')
    await scene.antonius.speech.say('Immer mit der Ruhe!\nWas hast du denn mit dem Messer vor?', null, 'sslssl')
    await scene.meckie.speech.say('Ich häcksel alles, groß und klein\nund du könntest der nächste sein', null, 'sslsllslsll')
    await scene.antonius.speech.say('Wäre es in Ordnung wenn du das...\nnicht tun könntest?', null, 'sslsss')
    await scene.meckie.speech.say('Verschonen könnt ich dich vielleicht,\neinfach was zum hacken reicht.', null, 'sisllslssl')
    await scene.meckie.speech.say('Wie wär’s mit ‘nem Zerteil-Versuch\nmit deinem kleinen Bibel-Buch? Hähähähä!', null, 'isslisslh')
    await scene.antonius.speech.say('Also bitte, dies ist ein Buch Gottes!', null, 'sssl')

    return MeckieRequest
  }
}

class MeckieRequest extends SceneStateTransition<BardScene> {
  public async enter() {
    const scene = this.scene
    await scene.resetAll()

    await scene.meckie.speech.say('Willst du nicht enden als Eingeweide,\nbring etwas, das ich zerschneide!', null, 'sslslsllslh')

    if (scene.game.state.states.fish.defaultStateManager.getActiveState() === FishAlive) {
      await scene.game.state.states.fish.defaultStateManager.setActiveState(FishDying)
    }

    return WaitingForFish
  }
}

class WaitingForFish extends SceneState<BardScene> {
  public async show() {
    const scene = this.scene
    await scene.resetScene(true)
    await scene.resetMeckieRelated()

    scene.meckie.interactionEnabled = true
    this.listeners.push(scene.meckie.events.onInputDown.addOnce(
      () => this.stateManager.trigger(MeckieRequest)
    ))
  }
}

export class AntoniusBroughtFish extends SceneState<BardScene> {
  public async show() {
    const scene = this.scene
    await scene.resetScene(true)
    await scene.resetMeckieRelated()

    scene.meckie.interactionEnabled = true
    this.listeners.push(scene.meckie.events.onInputUp.addOnce(
      () => this.stateManager.trigger(CutFish)
    ))
  }
}

class CutFish extends SceneStateTransition<BardScene> {
  public async enter() {
    const scene = this.scene
    await scene.resetAll()

    await scene.antonius.speech.say('Ich hätte hier einen Fisch,\nden du vielleicht zerschneiden könntest.', null, 'ssssss')
    await scene.meckie.speech.say('Ein Wasservieh, frisch aus der See,\nverwandle ich in Lachsfilet!', null, 'ilisi')

    scene.meckie.setActiveState('swinging')
    await TimeUtils.wait(1)

    await scene.antonius.speech.say('Toll! Willst du denn damit etwas kochen, oder…?', null, 'ssssl')

    Inventory.instance.item = Images.filet.key

    await scene.meckie.speech.say('Was ich tun wollt’ hab ich getan,\nich bin ja eigentlich vegan.', null, 'ssslsslsslsl')
    await scene.antonius.speech.say('Praktisch!', null, 's')
    await scene.meckie.speech.say('Das war jetzt auch mein letzter Reim,\nden Rest zerschnibbel ich daheim.', null, 'slsslsslslssl')
    await scene.antonius.speech.say('Tschüss!', null, 'l')

    scene.meckie.scale.x = -3
    scene.meckie.setActiveState('walking')
    this.scene.game.tweens.create(scene.meckie).to({
      x: -Math.abs(scene.meckie.width * scene.meckie.anchor.x)
    }, 3000).start()
    await TimeUtils.wait(3)

    this.scene.stateManagers.bard.setActiveState(FiletInThePocket)

    return FishCut
  }
}

class FishCut extends SceneState<BardScene> {
  public async show() {
    const scene = this.scene
    await scene.resetScene(true)
    await scene.resetMeckieRelated()
    scene.meckie.visible = false
  }
}
