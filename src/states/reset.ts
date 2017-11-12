import * as Assets from '../assets'
import * as AssetUtils from '../utils/assetUtils'

import Scene from './scenes/scene'

import Inventory from '../overlays/inventory'

export default class Reset extends Phaser.State {
  private preloadBarSprite: Phaser.Sprite = null
  private preloadFrameSprite: Phaser.Sprite = null

  public create() {
    console.dir(this.game.state.states)

    const states = <Phaser.State[]>Object.keys(this.game.state.states).map(key => this.game.state.states[key])
    const scenes = <Scene[]>states.filter(state => state instanceof Scene)

    console.log('Resetting all scene states')
    Promise.all(scenes.map(scene => scene.resetStates()))

    console.log('Clearing inventory')
    Inventory.instance.clear()

    console.log('Triggering intro scene')
    this.game.state.start('intro')
  }
}
