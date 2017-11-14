import * as Assets from '../assets'
import * as AssetUtils from '../utils/assetUtils'

import Scene from './scenes/scene'

import SettingsOverlay from '../overlays/settings'
import RestartOverlay from '../overlays/restart'
import Inventory from '../overlays/inventory'

export default class Reset extends Phaser.State {
  private preloadBarSprite: Phaser.Sprite = null
  private preloadFrameSprite: Phaser.Sprite = null

  public create() {
    const states = <Phaser.State[]>Object.keys(this.game.state.states).map(key => this.game.state.states[key])
    const scenes = <Scene[]>states.filter(state => state instanceof Scene)

    console.log('Resetting all scene states')
    Promise.all(scenes.map(scene => scene.resetStates()))

    console.log('Clearing inventory')
    Inventory.instance.clear()

    console.log('Hiding overlays')
    SettingsOverlay.instance.hide()
    RestartOverlay.instance.hide()
    Inventory.instance.hide()

    console.log('Triggering intro scene')
    this.game.state.start('intro')
  }
}
