import Character from '../characters/character'
import { ArrayUtils } from '../utils/utils'

export default class SpeechHelper {
  private anchor: Phaser.Point

  constructor(private character: Character, anchorX: number, anchorY: number,
              private sampleGenerator: () => () => string | null) {
    this.anchor = new Phaser.Point(anchorX, anchorY)
  }

  public async say(text: string, timeout?: number, abort?: Promise<void>,
             beforePlaying?: () => (Promise<void> | undefined)): Promise<void> {
    const nextSample = this.sampleGenerator()

    let stopConditions: Promise<void>[] = []
    if (timeout) {
      stopConditions.push(new Promise<void>(resolve => {
        const timer = this.character.game.time.create()
        timer.add(Phaser.Timer.SECOND * timeout, resolve)
        timer.start()
      }))
    }
    if (abort) {
      stopConditions.push(abort)
    }

    let playbackDone: () => void
    this.displayText(text, new Promise<void>(resolve => { playbackDone = resolve }))

    while (true) {
      try {
        if (beforePlaying) {
          await beforePlaying()
        }
        const nextUp = nextSample()
        if (!nextUp) {
          break
        }
        await this.play(nextUp, stopConditions)
      } catch (_) {
        break
      }
    }
    playbackDone()
  }

  private displayText(text: string, until: Promise<void>) {
    // TODO: display `text` over `character` relative to `anchor`
    const test = { } // TODO: create text object
    const removeText = () => { } // TODO: add text removal logic
    until.then(removeText, removeText)
  }

  private play(sample: string, abortConditions: Promise<void>[] = []): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      Promise.race(abortConditions).then(() => reject('abort'), reject)
      const sound = this.character.game.sound.play(sample)
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
    pattern: (samples: { [pattern: string]: string[] }, getPattern: () => string) => () => {
      const pattern: string[] = getPattern().split('')
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
        console.log(nextSample)
        return nextSample
      }
    }
  }
}
