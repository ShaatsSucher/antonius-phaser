import Character from './character'

export default CharacterState
interface CharacterState<T extends Character> {
  readonly character: T

  enter?(): Promise<void>
  exit?(): Promise<void>
}

export class TalkingCharacterState<T extends Character> implements CharacterState<T> {
  private activeSound: Phaser.Sound = null
  public text = ''
  public duration = 0
  private beginTalkingTimestamp = 0

  constructor(public character: T,
              private talkSamples: string[],
              private doneTalking: () => { }) { }

  async enter() {

  }

  async exit() {
    if (this.activeSound && (this.activeSound.isPlaying || this.activeSound.pendingPlayback)) {
      this.activeSound.stop()
    }
  }
}
