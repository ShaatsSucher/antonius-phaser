import Character from '../characters/character'
import { BitmapFonts } from '../assets'
import { ArrayUtils } from '../utils/utils'

export default class SpeechHelper {
  private textAnchor: Phaser.Point
  private currentSample: Phaser.Sound

  constructor(private character: Character,
              anchorX: number, anchorY: number,
              private sampleGenerator: (x?: string) => () => (string | null),
              private resetCharacterStateBeforePlaying = true,
              private idleState = 'idle',
              private talkingState = 'talking') {
    this.textAnchor = new Phaser.Point(anchorX, anchorY)
  }

  public async say(text: string, timeout?: number, generatorParam?: string): Promise<void> {
    const nextSample = this.sampleGenerator(generatorParam)

    const characterClicked = this.registerClickListener()

    let stopPlayback: Promise<any> = characterClicked
    if (timeout) {
      const timer = this.character.game.time.create()
      let timeoutCb: () => any
      const timeoutPromise = new Promise(resolve => { timeoutCb = resolve })
      timer.add(Phaser.Timer.SECOND * timeout, timeoutCb)
      timer.start()
      stopPlayback = Promise.race([characterClicked, timeoutPromise])
    }

    await this.character.setActiveState(this.talkingState)
    this.character.interactionEnabled = true

    this.displayText(text, characterClicked)
    while (true) {
      if (this.resetCharacterStateBeforePlaying) {
        await this.character.setActiveState(this.talkingState)
      }
      const nextUp = nextSample()
      if (!nextUp) {
        break
      }
      try {
        await this.play(nextUp, stopPlayback)
      } catch (_) {
        break
      }
    }
    await this.character.setActiveState(this.idleState)
    await characterClicked
    this.character.interactionEnabled = false
  }

  private registerClickListener(): Promise<void> {
    this.character.interactionEnabled = true
    return new Promise<void>(resolve => {
      this.character.events.onInputDown.addOnce(resolve)
    })
  }

  private displayText(text: string, shouldHide: Promise<void>) {
    const bitmapText = new Phaser.BitmapText(
      this.character.game, 0, 0, BitmapFonts.antoniusFont9px.key,
      text, 9, 'center'
    )
    this.character.game.add.existing(bitmapText)
    bitmapText.anchor.setTo(0.5, 1)

    const updateListener = this.character.onUpdate.add(() => {
      bitmapText.alignTo(
        this.character,
        Phaser.TOP_CENTER,
        this.textAnchor.x, this.textAnchor.y
      )
    })

    const removeText = () => {
      updateListener.detach()
      bitmapText.kill()
    }
    shouldHide.then(removeText, removeText)
  }

  private play(sample: string, abort: Promise<void>): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const sound = this.character.game.sound.play(sample)
      abort
      .then(() => reject('abort'), reject)
      .then(() => { if (sound.isPlaying || sound.pendingPlayback) sound.stop() })
      sound.onStop.addOnce(resolve)
    })
  }

  public static Generators = {
    sequential: (samples: string[]) => () => {
      let lastIndex = samples.length - 1
      return () => {
        const nextIndex = (lastIndex + 1) % samples.length
        lastIndex = nextIndex
        return samples[nextIndex]
      }
    },
    random: (samples: string[]) => () => {
      let lastSample = null
      return () => {
        const availableSamples = lastSample
          ? ArrayUtils.removeItem(samples, lastSample)
          : samples
        const nextSample = Phaser.ArrayUtils.getRandomItem(availableSamples)
        lastSample = nextSample
        return nextSample
      }
    },
    alternating: (samples: string[][]) => () => {
      let lastGroup = samples.length - 1
      return () => {
        const nextGroup = (lastGroup + 1) % samples.length
        lastGroup = nextGroup
        return Phaser.ArrayUtils.getRandomItem(samples[nextGroup])
      }
    },
    pattern: (samples: { [pattern: string]: string[] }) => (initPattern: string) => {
      const pattern: string[] = initPattern.split('')
      let currentRun = pattern
      let lastSample = null
      return () => {
        if (currentRun.length === 0) {
          return null
        }
        const currentToken = currentRun.shift()
        const availableSamples = lastSample
          ? ArrayUtils.removeItem(samples[currentToken], lastSample)
          : samples[currentToken]
        const nextSample = Phaser.ArrayUtils.getRandomItem(availableSamples)
        lastSample = nextSample
        return nextSample
      }
    }
  }
}
