import { Property } from './property'

export interface Pausable {
  readonly isPaused: Property<boolean>
}
