import Character from '../characters/character'
import { CustomWebFonts } from '../assets'
import { ArrayUtils } from '../utils/utils'
import { AudioManager, Clip } from '../utils/audioManager'
import { Pausable } from '../utils/pausable'
import { Property } from '../utils/property'

type SampleGenerator = (...generatorParams: any[]) => () => (string | null)
export default class SpeechHelper implements Pausable {
  private textAnchor: Phaser.Point
  private currentSample: Phaser.Sound

  public readonly isPaused = new Property<boolean>(false)

  constructor(private character: Character,
              anchorX: number, anchorY: number,
              private sampleGenerator: SampleGenerator,
              private textColor = '#fff',
              private resetCharacterStateBeforePlaying = true,
              public idleState = 'idle',
              public talkingState = 'talking') {
    this.textAnchor = new Phaser.Point(anchorX, anchorY)
  }

  public async say(text: string, timeout?: number, ...generatorParams: any[]): Promise<void> {
    const nextSample = this.sampleGenerator(...generatorParams)

    const characterClicked = this.registerClickListener()

    let stopPlayback: Promise<any> = characterClicked
    if (timeout) {
      const timer = this.character.game.time.create()
      let timeoutCb: () => any
      const timeoutPromise = new Promise(resolve => { timeoutCb = resolve })
      timer.add(Phaser.Timer.SECOND * timeout, timeoutCb)
      timer.start()
      stopPlayback = Promise.race([characterClicked, timeoutPromise])

      const pauseListener = this.isPaused.onValueChanged.add(paused => {
        paused ? timer.pause() : timer.resume()
      })
      stopPlayback.all(() => pauseListener.detach)
    }

    await this.character.setActiveState(this.talkingState)

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
  }

  private registerClickListener(): Promise<void> {
    return this.character.scene.clickedAnywhere()
  }

  public get textStyle() {
    return {
      font: `8px ${CustomWebFonts.pixelOperator8Bold.family}`,
      fill: this.textColor,
      stroke: '#000',
      strokeThickness: 2
    }
  }

  private displayText(text: string, shouldHide: Promise<void>) {
    const frameMargin = 5

    // For reasons of font-rendering, we need to render each line of the text
    // separately.
    const lines = text.split('\n')
    let groupWidth = 0
    const labels = lines.map(line => {
      const label = new Phaser.Text(this.character.game, 0, 0, line, this.textStyle)
      label.anchor.setTo(0.5, 0)
      groupWidth = Math.max(groupWidth, label.width)
      return label
    })

    const init: [Phaser.Group, number] = [this.character.game.add.group(), 0]
    const [group, groupHeight] = labels.reduce(([group, nextY], label): [Phaser.Group, number] => {
      // The font renders badly when the label's width is odd. Offsetting the
      // label a little seems to fix this.
      const correctionOffset = label.width % 2 === 1 ? 0.5 : 0

      label.position.setTo(
        Math.round(groupWidth / 2) + correctionOffset,
        Math.round(nextY)
      )
      group.add(label)
      return [group, nextY + label.height]
    }, init)

    if (groupWidth > this.character.game.width - (2 * frameMargin)) {
      console.warn(`Text is wider than allowed: '${text}'`)
    }
    if (groupHeight > this.character.game.height - (2 * frameMargin)) {
      console.warn(`Text is higher than allowed: '${text}'`)
    }

    const updateListener = this.character.onUpdate.add(() => {
      group.alignTo(
        this.character, Phaser.TOP_CENTER,
        this.textAnchor.x, this.textAnchor.y
      )

      group.x = Math.round(Math.max(frameMargin, Math.min(this.character.game.width - frameMargin - groupWidth, group.x)))
      group.y = Math.round(Math.max(frameMargin, Math.min(this.character.game.height - frameMargin - groupHeight, group.y)))
    })

    shouldHide.all(() => {
      updateListener.detach()
      group.destroy()
    })
  }

  private play(sample: string, abort: Promise<void>): Promise<void> {
    const clip = AudioManager.instance.tracks.speech.addClip(sample)
    clip.play()

    const promise = Promise.race([
      clip.stopped,
      abort.then(() => { throw 'abort' })
    ])
    abort.then(() => clip.stop())

    // Pause the current clip when pausing the SpeechHelper
    const pauseListener = this.isPaused.onValueChanged.add((paused) => {
      paused ? clip.pause() : clip.resume()
    })
    promise.all(() => pauseListener.detach())
    return promise
  }

  public static Generators = {
    mute: () => () => {
      return () => { return null }
    },
    combine: (generators: { [title: string]: SampleGenerator }) => (generator = 'default', ...params: any[]) => {
      return generators[generator](...params)
    },
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
    },
    explicit: () => (sample: string | string[]) => () =>
      typeof sample === 'string'
        ? sample
        : sample instanceof Array
          ? sample.shift()
          : null
  }
}
