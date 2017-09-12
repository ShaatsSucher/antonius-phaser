import { Button } from './button'
import { Atlases } from '../assets'

export default class Arrow extends Button {
  constructor(game: Phaser.Game, x: number, y: number) {
    super(game, x, y, Atlases.arrow.key)
  }
}
