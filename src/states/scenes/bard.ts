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
import { AudioManager } from '../../utils/audioManager'

import Inventory from '../../overlays/inventory'
import { ArrayUtils, StringUtils } from '../../utils/utils'

export default class BardScene extends Scene {
  public characters = {
    antonius: null,
    goose: null,
    bard: null,
    cat: null,
    meckie: null
  }

  public interactiveObjects = {
    toHeadArrow: null,
    toKitchenArrow: null,
    toTreeArrow: null
  }

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

  constructor(game: Phaser.Game) {
    super(game, Images.backgroundsBard.key, Audio.soundscapesScene6.key, [])

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
    const goose = this.characters.goose = new GooseCharacter(this, 144, 10)
    goose.scale = new Phaser.Point(3, 3)
    goose.anchor.setTo(0.5, 0)
    goose.setActiveState('idle')
    this.add.existing(goose)

    const bard = this.characters.bard = new BardCharacter(this, 144, 10)
    bard.scale = new Phaser.Point(3, 3)
    bard.anchor.setTo(0.5, 0)
    bard.setActiveState('idle')
    this.add.existing(bard)

    const cat = this.characters.cat = new CatCharacter(this, 144, 64)
    cat.scale = new Phaser.Point(3, 3)
    cat.anchor.setTo(0.5, 0)
    cat.setActiveState('idle')
    this.add.existing(cat)

    const meckie = this.characters.meckie = new MeckieCharacter(this, 78, 120)
    meckie.scale = new Phaser.Point(3, 3)
    meckie.anchor.setTo(0.5, 0)
    meckie.setActiveState('idle')
    this.add.existing(meckie)

    const antonius = this.characters.antonius = new AntoniusCharacter(this, 292, 120)
    antonius.scale = new Phaser.Point(3, 3)
    antonius.setActiveState('idle')
    this.add.existing(antonius)

    const toHeadArrow = this.interactiveObjects.toHeadArrow = new Arrow(this.game, 20, 95)
    toHeadArrow.rotation = Math.PI
    toHeadArrow.interactionEnabled = true
    this.game.add.existing(toHeadArrow)
    toHeadArrow.events.onInputDown.addOnce(() => {
      toHeadArrow.interactionEnabled = false
      this.fadeTo('head')
    })

    const toKitchenArrow = this.interactiveObjects.toKitchenArrow = new Arrow(this.game, 192, 196)
    toKitchenArrow.rotation = Math.PI / 2
    toKitchenArrow.interactionEnabled = true
    this.game.add.existing(toKitchenArrow)
    toKitchenArrow.events.onInputDown.addOnce(() => {
      toKitchenArrow.interactionEnabled = false
      this.fadeTo('kitchen')
    })

    const toTreeArrow = this.interactiveObjects.toTreeArrow = new Arrow(this.game, 364, 95)
    toTreeArrow.interactionEnabled = true
    this.game.add.existing(toTreeArrow)
    toTreeArrow.events.onInputDown.addOnce(() => {
      toTreeArrow.interactionEnabled = false
      this.fadeTo('tree')
    })
  }

  async resetScene(showArrows = false) {
    this.interactiveObjects.toHeadArrow.visible = showArrows

    this.characters.antonius.interactionEnabled = false

    await this.characters.antonius.setActiveState('idle')
  }

  async resetBardRelated() {
    this.characters.goose.interactionEnabled = false
    this.characters.bard.interactionEnabled = false
    this.characters.cat.interactionEnabled = false

    await this.characters.goose.setActiveState('idle')
    await this.characters.bard.setActiveState('idle')
    await this.characters.cat.setActiveState('idle')
  }

  async resetMeckieRelated() {
    this.characters.meckie.interactionEnabled = false

    await this.characters.meckie.setActiveState('idle')
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

    this.scene.setMusicClips([])

    scene.characters.bard.interactionEnabled = true

    this.listeners.push(scene.characters.bard.events.onInputUp.addOnce(
      () => scene.stateManagers.bard.trigger(BardConversation)
    ))
  }
}

class BardConversation extends SceneStateTransition<BardScene> {
  public async enter() {
    const scene = this.scene
    await scene.resetAll()

    scene.characters.bard.setActiveState('singing')
    scene.characters.bard.interactionEnabled = true
    const bardSong = scene.sound.play(Audio.bardSongShort.key)
    bardSong.onStop.addOnce(() => { scene.characters.bard.setActiveState('idle') })

    await scene.clickedAnywhere()
    bardSong.stop()
    scene.characters.bard.setInteractionEnabled(false)

    this.scene.setMusicClips(Audio.musicBard.key)

    await scene.characters.goose.speech.say('Ach du meine Güte.\n Wie theatralisch!', 3)
    await scene.characters.antonius.speech.say('Ihr da, auf dem fantastischen Reitwesen!', null, 'slssls')
    await scene.characters.antonius.speech.say('Dieses Lied klingt so unendlich einsam,\nwarum seid Ihr so traurig?', null, 'ssssssss')
    await scene.characters.bard.speech.say('Hört mir denn keiner zu?\nIch vermisse meine Freundin,\ndie Reitgans, sehr!', 10)
    await scene.characters.goose.speech.say('So weit sind wir ja nicht von einander entfernt...', 6)
    await scene.characters.antonius.speech.say('Stimmt, soweit seid ihr doch\nnicht voneinander entfernt.', null, 'sssssss')
    await scene.characters.antonius.speech.say('Dreht euch doch ein mal um.', null, 'ssl')
    await scene.characters.bard.speech.say('Das geht nicht. Da ist etwas hinter mir!', 6)
    await scene.characters.antonius.speech.say('Ich sehe das Problem.\nVielleicht kann ich helfen.', null, 'ssssss')

    await scene.game.state.states.head.defaultStateManager.setActiveState(FishHintAvailable)

    return CatInTheWay
  }
}

class CatInTheWay extends SceneState<BardScene> {
  public async show() {
    const scene = this.scene
    await scene.resetScene(true)
    await scene.resetBardRelated()

    this.scene.setMusicClips(Audio.musicBard.key)

    scene.characters.cat.interactionEnabled = true
    this.listeners.push(scene.characters.cat.events.onInputUp.addOnce(
      () => scene.stateManagers.bard.trigger(AnnoyedCat)
    ))

    scene.characters.bard.interactionEnabled = true
    this.listeners.push(scene.characters.bard.events.onInputUp.addOnce(
      () => scene.stateManagers.bard.trigger(SadBard)
    ))
  }
}

class AnnoyedCat extends SceneStateTransition<BardScene> {
  public async enter() {
    const scene = this.scene
    await scene.resetAll()
    await scene.characters.cat.speech.say('[genervtes Miauen]', 4.9)
    await scene.characters.antonius.speech.say('Das wird wohl schwieriger als gedacht...', null, 'sssssl')

    return CatInTheWay
  }
}

class SadBard extends SceneStateTransition<BardScene> {
  public async enter() {
    const scene = this.scene
    await scene.resetAll()
    await scene.characters.bard.speech.say('*seufz*', 2, 'practice')
    await scene.characters.goose.speech.say(Phaser.ArrayUtils.getRandomItem([
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

    scene.characters.cat.interactionEnabled = true
    this.clearListeners()
    this.listeners.push(scene.characters.cat.events.onInputUp.addOnce(
      () => { this.stateManager.trigger(CatFeast) }
    ))
  }
}

class CatFeast extends SceneStateTransition<BardScene> {
  public async enter() {
    const scene = this.scene
    await scene.resetAll()

    await scene.characters.antonius.speech.say('Hier, Miez!\nIch hab einen Fisch für dich.', null, 'llsssslsl')
    await scene.characters.cat.speech.say('...', 1, 'silent')
    await scene.characters.antonius.speech.say('Komm, hol dir einen leckeren Fisch!', null, 'lsssssssl')
    await scene.characters.cat.speech.say('...', 1, 'silent')
    await scene.wait(0.5)
    Inventory.instance.takeItem(Images.filet.key)
    await scene.wait(0.5)
    await scene.characters.cat.speech.say('... Angemessen.', 1, 'silent', Audio.catCatAccepts.key)
    await scene.characters.antonius.speech.say('...', null, '')
    await scene.characters.antonius.speech.say('Was?', null, 'l')

    await scene.tweens.create(scene.characters.cat).to({
      y: 150
    }, 500, i => (1 + 2 / 3) * i * i - (2 / 3) * i).start().onComplete.asPromise()

    scene.characters.cat.scale.x =  -3
    scene.characters.cat.setActiveState('walking')
    await scene.tweens.create(scene.characters.cat).to({
      x: -Math.abs(scene.characters.cat.width * scene.characters.cat.anchor.x)
    }, 3000).start().onComplete.asPromise()

    return CatGone
  }
}

class CatGone extends SceneState<BardScene> {
  public async show() {
    const scene = this.scene
    await scene.resetScene(true)
    await scene.resetBardRelated()

    scene.characters.cat.visible = false
    scene.characters.bard.interactionEnabled = true
    this.listeners.push(scene.characters.bard.events.onInputUp.addOnce(
      () => this.stateManager.trigger(HelloThere)
    ))
  }
}

class HelloThere extends SceneStateTransition<BardScene> {
  public async enter() {
    const scene = this.scene
    await scene.resetAll()

    scene.characters.cat.visible = false

    await scene.characters.bard.speech.say('Oh! Was für ein sonderbares Gefühl!', 3)
    await scene.characters.bard.speech.say('Als hätte sich eine Blockade\nvon meinem Rücken gelöst!', 5)
    await scene.characters.bard.speech.say('Was war das für eine schreckliche Last,\ndie soeben verschwunden ist?', 5)
    scene.characters.bard.scale.x = -3
    scene.characters.bard.x = 124
    scene.characters.bard.y = 7
    await scene.wait(0.5)
    await scene.characters.bard.speech.say('Ach da bist du ja, Reitgans!', 3)
    await scene.characters.goose.speech.say('... Ja, da bin ich.\nSchon die ganze Zeit.', 4)
    await scene.characters.bard.speech.say('Oh, du wirst nicht glauben,\nwie lange ich nach dir gesucht habe!', 5)
    await scene.characters.goose.speech.say('Ich kann\'s mir vorstellen.', 3)
    await scene.characters.bard.speech.say('Komm, lass uns nach Hause gehen!', 3)
    scene.characters.bard.scale.x = 3
    scene.characters.bard.x = 164
    scene.characters.goose.scale.x = -3
    scene.characters.bard.setActiveState('walking')
    scene.characters.goose.setActiveState('walking')

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

    const xmin = -Math.abs((1 - scene.characters.goose.anchor.x) * scene.characters.goose.width)
    await Promise.all([
      scene.tweens.create(scene.characters.goose).to({ x: xmin }, 3000, interpolate).start().onComplete.asPromise(),
      scene.tweens.create(scene.characters.bard).to({ x: xmin }, 3000, interpolate).start().onComplete.asPromise()
    ])

    return BardGone
  }
}

class BardGone extends SceneState<BardScene> {
  public async show() {
    const scene = this.scene
    await scene.resetScene()
    await scene.resetBardRelated()

    scene.characters.cat.visible = false
    scene.characters.goose.visible = false
    scene.characters.bard.visible = false

    await scene.game.state.states.head.defaultStateManager.setActiveState(Suction)
  }
}



class InitialMeckie extends SceneState<BardScene> {
  public async show() {
    const scene = this.scene
    await scene.resetScene(true)
    await scene.resetMeckieRelated()

    scene.characters.meckie.interactionEnabled = true
    this.listeners.push(scene.characters.meckie.events.onInputUp.addOnce(
      () => this.stateManager.trigger(MeckieIntroduction)
    ))
  }
}

class MeckieIntroduction extends SceneStateTransition<BardScene> {
  public async enter() {
    const scene = this.scene
    await scene.resetAll()

    await scene.characters.meckie.speech.say('Schnibbel schnabbel schnapp!\nIch schneid dir die Kapuze ab!', null, 'sssslsll')
    await scene.characters.antonius.speech.say('Immer mit der Ruhe!\nWas hast du denn mit dem Messer vor?', null, 'sslssl')
    await scene.characters.meckie.speech.say('Ich häcksel alles, groß und klein\nund du könntest der nächste sein', null, 'sslsllslsll')
    await scene.characters.antonius.speech.say('Wäre es in Ordnung wenn du das...\nnicht tun könntest?', null, 'sslsss')
    await scene.characters.meckie.speech.say('Verschonen könnt ich dich vielleicht,\neinfach was zum hacken reicht.', null, 'sisllslssl')
    await scene.characters.meckie.speech.say('Wie wär’s mit ‘nem Zerteil-Versuch\nmit deinem kleinen Bibel-Buch? Hähähähä!', null, 'isslisslh')
    await scene.characters.antonius.speech.say('Also bitte, dies ist ein Buch Gottes!', null, 'sssl')

    return MeckieRequest
  }
}

class MeckieRequest extends SceneStateTransition<BardScene> {
  public async enter() {
    const scene = this.scene
    await scene.resetAll()

    await scene.characters.meckie.speech.say('Willst du nicht enden als Eingeweide,\nbring etwas, das ich zerschneide!', null, 'sslslsllslh')

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

    scene.characters.meckie.interactionEnabled = true
    this.listeners.push(scene.characters.meckie.events.onInputDown.addOnce(
      () => this.stateManager.trigger(MeckieRequest)
    ))
  }
}

export class AntoniusBroughtFish extends SceneState<BardScene> {
  public async show() {
    const scene = this.scene
    await scene.resetScene(true)
    await scene.resetMeckieRelated()

    scene.characters.meckie.interactionEnabled = true
    this.listeners.push(scene.characters.meckie.events.onInputUp.addOnce(
      () => this.stateManager.trigger(CutFish)
    ))
  }
}

class CutFish extends SceneStateTransition<BardScene> {
  public async enter() {
    const scene = this.scene
    await scene.resetAll()

    await scene.characters.antonius.speech.say('Ich hätte hier einen Fisch,\nden du vielleicht zerschneiden könntest.', null, 'ssssss')
    await scene.characters.meckie.speech.say('Ein Wasservieh, frisch aus der See,\nverwandle ich in Lachsfilet!', null, 'ilisi')

    Inventory.instance.takeItem(Images.fish.key)

    scene.characters.meckie.setActiveState('swinging')
    await scene.wait(1)

    await scene.characters.antonius.speech.say('Toll! Willst du denn damit etwas kochen, oder…?', null, 'ssssl')

    Inventory.instance.addItem(Images.filet.key, 2)

    await scene.characters.meckie.speech.say('Was ich tun wollt’ hab ich getan,\nich bin ja eigentlich vegan.', null, 'ssslsslsslsl')
    await scene.characters.antonius.speech.say('Praktisch!', null, 's')
    await scene.characters.meckie.speech.say('Das war jetzt auch mein letzter Reim,\nden Rest zerschnibbel ich daheim.', null, 'slsslsslslssl')
    await scene.characters.antonius.speech.say('Tschüss!', null, 'l')

    scene.characters.meckie.scale.x = -3
    scene.characters.meckie.setActiveState('walking')

    await this.scene.tweens.create(scene.characters.meckie).to({
      x: -Math.abs(scene.characters.meckie.width * scene.characters.meckie.anchor.x)
    }, 3000).start().onComplete.asPromise()

    this.scene.stateManagers.bard.setActiveState(FiletInThePocket)

    return FishCut
  }
}

class FishCut extends SceneState<BardScene> {
  public async show() {
    const scene = this.scene
    await scene.resetScene(true)
    await scene.resetMeckieRelated()
    scene.characters.meckie.visible = false
  }
}
