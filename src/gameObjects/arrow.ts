import { Button } from './button'
import { Spritesheets } from '../assets'

export default class Arrow extends Button {
  constructor(game: Phaser.Game, x: number, y: number) {
    super(game, x, y, Spritesheets.arrow.key, [0], [1], [1], [0])
  }
}
