import 'p2'
import 'pixi'
import 'phaser'

import * as WebFontLoader from 'webfontloader'

import Boot from './states/boot'
import Preloader from './states/preloader'
import * as Utils from './utils/utils'
import * as Assets from './assets'

import 'es6-promise/auto'
import './utils/extensions'

class App extends Phaser.Game {
  constructor(config: Phaser.IGameConfig) {
    super (config)

    if (DEBUG) {
      window['game'] = this
    }

    this.state.add('boot', Boot, true)
    this.state.add('preloader', Preloader)
  }
}

function startApp(): void {
  let gameWidth: number = DEFAULT_GAME_WIDTH
  let gameHeight: number = DEFAULT_GAME_HEIGHT

  if (SCALE_MODE === 'USER_SCALE') {
    let screenMetrics: Utils.ScreenMetrics = Utils.ScreenUtils.calculateScreenMetrics(gameWidth, gameHeight)

    gameWidth = screenMetrics.gameWidth
    gameHeight = screenMetrics.gameHeight
  }

  // There are a few more options you can set if needed, just take a look at Phaser.IGameConfig
  let gameConfig: Phaser.IGameConfig = {
    width: gameWidth,
    height: gameHeight,
    renderer: Phaser.AUTO,
    parent: '',
    resolution: 1,
    antialias: false
  }

  let app = new App(gameConfig)
}

window.onload = () => {
  let webFontLoaderOptions: any = null
  let webFontsToLoad: string[] = GOOGLE_WEB_FONTS

  if (webFontsToLoad.length > 0) {
    webFontLoaderOptions = (webFontLoaderOptions || {})

    webFontLoaderOptions.google = {
      families: webFontsToLoad
    }
  }

  if (Object.keys(Assets.CustomWebFonts).length > 0) {
    webFontLoaderOptions = (webFontLoaderOptions || {})

    webFontLoaderOptions.custom = {
      families: [],
      urls: []
    }

    for (let fontName of Object.keys(Assets.CustomWebFonts)) {
      const font = Assets.CustomWebFonts[fontName]
      webFontLoaderOptions.custom.families.push(font.family)
      webFontLoaderOptions.custom.urls.push(font.css)
    }
  }

  if (webFontLoaderOptions === null) {
    // Just start the game, we don't need any additional fonts
    startApp()
  } else {
    // Load the fonts defined in webFontsToLoad from Google Web Fonts, and/or any Local Fonts then start the game knowing the fonts are available
    webFontLoaderOptions.active = startApp

    WebFontLoader.load(webFontLoaderOptions)
  }
}
