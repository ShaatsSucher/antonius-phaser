import Scene from './scene'

export default SceneState
interface SceneState<T extends Scene> {
  readonly scene: T

  getStateName(): string

  enter(): Promise<void>
  exit?(): Promise<void>
}
