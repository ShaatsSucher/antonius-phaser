import Character from '../characters/character'
import { CustomWebFonts } from '../assets'
import { ArrayUtils } from '../utils/utils'

type SampleGenerator = (...generatorParams: any[]) => () => (string | null)
export default class SpeechHelper {
  private textAnchor: Phaser.Point
  private currentSample: Phaser.Sound

  constructor(private character: Character,
              anchorX: number, anchorY: number,
              private sampleGenerator: SampleGenerator,
              private resetCharacterStateBeforePlaying = true,
              private idleState = 'idle',
              private talkingState = 'talking') {
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
      this.character.game.input.mouse.capture = true
      let mouseWasUp = false
      let mouseWasDown = false
      let handle: Phaser.SignalBinding
      handle = this.character.onUpdate.add(() => {
        if (!this.character.game.input.activePointer.leftButton.isDown) {
          mouseWasUp = true
        }
        if (mouseWasUp && this.character.game.input.activePointer.leftButton.isDown) {
          mouseWasDown = true
        }
        if (mouseWasDown && !this.character.game.input.activePointer.leftButton.isDown) {
          this.character.game.input.mouse.capture = false
          handle.detach()
          resolve()
        }
      })
    })
  }

  private displayText(text: string, shouldHide: Promise<void>) {
    // For reasons of font-rendering, we need to render each line of the text
    // separately.
    const lines = text.split('\n').reverse()
    const labels = lines.map(line => {
      const label = this.character.game.add.text(0, 0, line, {
        font: `8px ${CustomWebFonts.pixelOperator8Bold.family}`,
        fill: '#fff',
        stroke: '#000',
        strokeThickness: 2
      })
      label.anchor.setTo(0.5, 1)
      return label
    })

    const updateListener = this.character.onUpdate.add(() => {
      labels.forEach((label, index) => {
        if (index === 0) {
          // label directly above character
          label.alignTo(
            this.character, Phaser.TOP_CENTER,
            this.textAnchor.x, this.textAnchor.y
          )
        } else {
          label.alignTo(labels[index - 1], Phaser.TOP_CENTER)
        }
        label.x = Math.round(label.x)
        label.y = Math.round(label.y)
        if (label.width % 2 === 1) {
          // The font renders badly when the label's width isn't even.
          // Moving the label 0.5px to the right seems to fix this.
          label.x += 0.5
        }
        // if the text would leave the screen on the sides, offset it accordingly
        const tooFarRight = (label.x + (label.width / 2)) - this.character.game.width
        if (tooFarRight > 0) label.x -= tooFarRight
        const tooFarLeft = label.x - (label.width / 2)
        if (tooFarLeft < 0) label.x -= tooFarLeft

      })
    })

    const removeText = () => {
      updateListener.detach()
      labels.forEach(label => label.kill())
    }
    shouldHide.then(removeText, removeText)
  }

  private play(sample: string, abort: Promise<void>): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      // NOTE: passing the global volume here really shouldn't be necessary,
      //       but if we don't, it *sometimes* ignores the global volume.
      const sound = this.character.game.sound.play(sample, this.character.game.sound.volume)
      abort
      .then(() => reject('abort'), reject)
      .then(() => { if (sound.isPlaying || sound.pendingPlayback) sound.stop() })
      sound.onStop.addOnce(resolve)
    })
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
