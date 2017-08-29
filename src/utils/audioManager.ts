import { TimeUtils } from './utils'

export class AudioManager {
  public readonly onMasterVolumeChanged = new Phaser.Signal()
  private masterVolume: number
  public readonly tweenManager: Phaser.TweenManager
  private readonly timer: Phaser.Timer

  public readonly tracks = {
    atmo: new AudioTrack(this, 'atmo'),
    music: new AudioTrack(this, 'music', 0.5),
    speech: new AudioTrack(this, 'speech')
  }

  private constructor(readonly soundManager: Phaser.SoundManager) {
    this.master = window.localStorage.getNumber('audioMasterVolume', 0.5)
    this.tweenManager = new Phaser.TweenManager(soundManager.game)

    // Patch the game object to call our tweenManager's update method every
    // frame. Necessary since otherwise the game clears all tweens on every
    // scene switch.
    const updateLogic = soundManager.game.updateLogic
    soundManager.game.updateLogic = timeStep => {
      updateLogic.call(soundManager.game, timeStep)
      this.tweenManager.update()
    }
  }

  private static inst: AudioManager
  public static get instance(): AudioManager { return AudioManager.inst }
  public static init(soundManager: Phaser.SoundManager) {
    if (AudioManager.inst) { throw 'AudioManager is already initialized' }
    AudioManager.inst = new AudioManager(soundManager)
  }

  public get master(): number {
    return this.masterVolume
  }
  public set master(value: number) {
    this.masterVolume = Math.max(0, Math.min(1, value))
    window.localStorage.setItem('audioMasterVolume', `${value}`)
    this.allTracks.forEach(track => track.updateVolume())
    this.onMasterVolumeChanged.dispatch(this.masterVolume)
  }

  public get allTracks(): AudioTrack[] {
    return Object.keys(this.tracks).map(trackName => this.tracks[trackName])
  }

  public getActiveClips(key: string): Clip[] {
    return this.allTracks.flatMap(track => track.getActiveClip(key))
  }
}

export class AudioTrack {
  private clips: { [key: string]: Clip } = { }
  private trackVolume: number
  public readonly onTrackVolumeChange = new Phaser.Signal()

  constructor(public readonly audioManager: AudioManager,
              public readonly trackName: string,
              defaultVolume = 1) {
    this.volume = window.localStorage.getNumber(`audioTrackVolume_${trackName}`, defaultVolume)
  }

  public get volume(): number {
    return this.trackVolume
  }
  public set volume(value: number) {
    this.trackVolume = Math.max(0, Math.min(1, value))
    window.localStorage.setItem(`audioTrackVolume_${this.trackName}`, `${value}`)
    this.allClips.forEach(clip => clip.updateVolume())
    this.onTrackVolumeChange.dispatch(this.trackVolume)
  }

  public get allClips(): Clip[] {
    return Object.keys(this.clips).map(key => this.clips[key])
  }

  public getActiveClip(key: string): Clip {
    const clipKeys = Object.keys(this.clips)
    const clipIndex = clipKeys.indexOf(key)
    return clipIndex === -1 ? null : this.clips[clipKeys[clipIndex]]
  }

  public addClip(key: string, volume = 1, autoPlay = true, loop = false): Clip {
    if (this.clips[key] !== undefined) {
      return this.clips[key]
    }

    const clip = new Clip(key, this, volume, loop)
    this.clips[key] = clip
    clip.stopped.then(() => {
      delete this.clips[key]
    })
    if (autoPlay) {
      clip.play()
    }
    return clip
  }

  public playClip(key: string, volume = 1, loop = false): Promise<void> {
    return this.addClip(key, volume, true, loop).stopped
  }

  public async fade(fromClips: string[], toClips: string[],
                    targetVolume = 1, duration = 1, loop = false): Promise<void> {
    const { fadeOuts, fadeIns } = this.getFades(fromClips, toClips, targetVolume, duration, loop)
    await Promise.all(fadeOuts)
    await Promise.all(fadeIns)
  }

  public fadeAll(toClips: string[], targetVolume = 1, duration = 1, loop = false): Promise<void> {
    return this.fade(Object.keys(this.clips), toClips, targetVolume, duration, loop)
  }

  public async crossFade(fromClips: string[], toClips: string[],
                         targetVolume = 1, duration = 1, loop = false): Promise<void> {
    const { fadeOuts, fadeIns } = this.getFades(fromClips, toClips, targetVolume, duration, loop)
    await Promise.all(fadeOuts.concat(fadeIns))
  }

  private getFades(fromClips: string[], toClips: string[], targetVolume = 1, duration = 1, loop = false): { fadeOuts: Promise<void>[], fadeIns: Promise<void>[] } {
    const crossSection = fromClips.filter(element => toClips.indexOf(element) !== -1)
    fromClips = fromClips.filter(element => crossSection.indexOf(element) === -1)
    toClips = toClips.filter(element => crossSection.indexOf(element) === -1)

    return {
      fadeOuts: fromClips
        .flatMap(key => {
          const clip = this.clips[key]
          delete this.clips[key]
          return clip
        })
        .map(clip => clip.fadeTo(0, duration).then(() => clip.stop())),
      fadeIns: toClips
        .map(key => this.addClip(key, 0, false, loop))
        .map(clip => clip.fadeTo(targetVolume, duration))
    }
  }

  public crossFadeAll(toClips: string[], targetVolume = 1, duration = 1, loop = false): Promise<void> {
    return this.crossFade(Object.keys(this.clips), toClips, targetVolume, duration, loop)
  }
}

export class Clip {
  public readonly sound: Phaser.Sound
  private soundStopped = false
  public stopped: Promise<void>

  constructor(public readonly key: string,
              private readonly track: AudioTrack,
              private clipVolume = 1,
              loop = false) {
    this.sound = track.audioManager.soundManager.add(key)
    this.stopped = this.sound.onStop.asPromise()
    this.stopped.then(() => this.soundStopped = true)
    this.sound.loop = loop
    this.sound.volume = this.effectiveVolume
    this.sound.pause()
  }

  get volume(): number {
    return this.clipVolume
  }
  set volume(value: number) {
    this.clipVolume = Math.max(0, Math.min(1, value))
    this.updateVolume()
  }

  get effectiveVolume(): number {
    return this.volume * this.track.volume * this.track.audioManager.master
  }

  public updateVolume() {
    this.sound.volume = this.effectiveVolume
  }

  public play(): Promise<void> {
    if (this.soundStopped) { return Promise.reject('Clip was already stopped') }

    this.sound.volume = this.effectiveVolume
    this.sound.play()

    this.stopped = new Promise<void>(resolve => { this.sound.onStop.addOnce(resolve) })
    return this.stopped
  }

  public pause() {
    !this.soundStopped && this.sound.pause()
  }

  public stop() {
    if (this.soundStopped) { return }
    this.sound.stop()
    this.sound.destroy()
  }

  public fadeTo(volume: number, duration: number): Promise<void> {
    if (this.soundStopped) {
      return Promise.reject('Clip was already stopped')
    }

    if (volume === this.volume) {
      return Promise.resolve()
    }

    if (!this.sound.isPlaying) {
      this.play()
    }

    const fade = { volume: this.volume }

    const tween = this.track.audioManager.tweenManager.create(this)
      .to({ volume: volume }, duration * Phaser.Timer.SECOND, Phaser.Easing.Linear.None)
      .start()

    return tween.onComplete.asPromise().then(() => { this.volume = volume })
  }
}
