import * as Assets from '../assets'

function listGetters(thing) {
  const properties = Object.getOwnPropertyNames(thing)
  let getters = []
  for (let property of properties) {
    const descriptor = Object.getOwnPropertyDescriptor(thing, property)
    if (typeof descriptor.get === 'function') {
      getters.push(property)
    }
  }
  return getters
}

export class Loader {
  private static game: Phaser.Game = null
  private static soundKeys: string[] = []
  private static soundExtensionsPreference: string[] = SOUND_EXTENSIONS_PREFERENCE

  private static loadImages() {
    for (let image in Assets.Images) {
      if (!this.game.cache.checkImageKey(Assets.Images[image].key)) {
        for (let option of listGetters(Assets.Images[image])) {
          if (option !== 'key') {
            this.game.load.image(
              Assets.Images[image].key,
              Assets.Images[image][option]
            )
          }
        }
      }
    }
  }

  private static loadSpritesheets() {
    for (let spritesheet in Assets.Spritesheets) {
      if (!this.game.cache.checkImageKey(Assets.Spritesheets[spritesheet].key)) {
        let imageOption = null

        for (let option of listGetters(Assets.Spritesheets[spritesheet])) {
          if (option !== 'key' && option !== 'frameWidth'
              && option !== 'frameHeight' && option !== 'frameMax'
              && option !== 'margin' && option !== 'spacing') {
            imageOption = option
          }
        }

        this.game.load.spritesheet(
          Assets.Spritesheets[spritesheet].key,
          Assets.Spritesheets[spritesheet][imageOption],
          Assets.Spritesheets[spritesheet].frameWidth,
          Assets.Spritesheets[spritesheet].frameHeight,
          Assets.Spritesheets[spritesheet].frameMax,
          Assets.Spritesheets[spritesheet].margin,
          Assets.Spritesheets[spritesheet].spacing
        )
      }
    }
  }

  private static loadAtlases() {
    for (let atlas in Assets.Atlases) {
      if (!this.game.cache.checkImageKey(Assets.Atlases[atlas].key)) {
        let imageOption = null
        let dataOption = null

        for (let option of listGetters(Assets.Atlases[atlas])) {
          if (option === 'xml' || option === 'jsonArray'
              || option === 'jsonHash') {
            dataOption = option
          } else if (option !== 'key' && option !== 'Frames') {
            imageOption = option
          }
        }

        if (dataOption === 'xml') {
          this.game.load.atlasXML(
            Assets.Atlases[atlas].key,
            Assets.Atlases[atlas][imageOption],
            Assets.Atlases[atlas].xml
          )
        } else if (dataOption === 'jsonArray') {
          this.game.load.atlasJSONArray(
            Assets.Atlases[atlas].key,
            Assets.Atlases[atlas][imageOption],
            Assets.Atlases[atlas].jsonArray
          )
        } else if (dataOption === 'jsonHash') {
          this.game.load.atlasJSONHash(
            Assets.Atlases[atlas].key,
            Assets.Atlases[atlas][imageOption],
            Assets.Atlases[atlas].jsonHash
          )
        }
      }
    }
  }

  private static orderAudioSourceArrayBasedOnSoundExtensionPreference(soundSourceArray: string[]): string[] {
    return soundSourceArray.concat().sort((lhs, rhs) => {
      const orderL = this.soundExtensionsPreference.indexOf(lhs.match(/\.(\w+)$/i)[1])
      const orderR = this.soundExtensionsPreference.indexOf(lhs.match(/\.(\w+)$/i)[1])
      return orderR - orderL
    })
  }

  private static loadAudio() {
    for (let audio in Assets.Audio) {
      let soundName = Assets.Audio[audio].key
      this.soundKeys.push(soundName)

      if (!this.game.cache.checkSoundKey(soundName)) {
        let audioTypeArray = []

        for (let option of listGetters(Assets.Audio[audio])) {
          if (option !== 'key') {
            audioTypeArray.push(Assets.Audio[audio][option])
          }
        }

        audioTypeArray = this.orderAudioSourceArrayBasedOnSoundExtensionPreference(audioTypeArray)

        this.game.load.audio(soundName, audioTypeArray, true)
      }
    }
  }

  private static loadAudiosprites() {
    for (let audio in Assets.Audiosprites) {
      let soundName = Assets.Audiosprites[audio].key
      this.soundKeys.push(soundName)

      if (!this.game.cache.checkSoundKey(soundName)) {
        let audioTypeArray = []

        for (let option of listGetters(Assets.Audiosprites[audio])) {
          if (option !== 'key' && option !== 'json' && option !== 'Sprites') {
            audioTypeArray.push(Assets.Audiosprites[audio][option])
          }
        }

        audioTypeArray = this.orderAudioSourceArrayBasedOnSoundExtensionPreference(audioTypeArray)

        this.game.load.audiosprite(soundName, audioTypeArray, Assets.Audiosprites[audio].json, null, true)
      }
    }
  }

  private static loadBitmapFonts() {
    for (let font in Assets.BitmapFonts) {
      if (!this.game.cache.checkBitmapFontKey(Assets.BitmapFonts[font].key)) {
        let imageOption = null
        let dataOption = null

        for (let option of listGetters(Assets.BitmapFonts[font])) {
          if (option === 'xml' || option === 'fnt') {
            dataOption = option
          } else if (option !== 'key') {
            imageOption = option
          }
        }

        this.game.load.bitmapFont(Assets.BitmapFonts[font].key, Assets.BitmapFonts[font][imageOption], Assets.BitmapFonts[font][dataOption])
      }
    }
  }

  private static loadJSON() {
    for (let json in Assets.JSON) {
      if (!this.game.cache.checkJSONKey(Assets.JSON[json].key)) {
        this.game.load.json(Assets.JSON[json].key, Assets.JSON[json].json, true)
      }
    }
  }

  private static loadXML() {
    for (let xml in Assets.XML) {
      if (!this.game.cache.checkXMLKey(Assets.XML[xml].key)) {
        this.game.load.xml(Assets.XML[xml].key, Assets.XML[xml].xml, true)
      }
    }
  }

  private static loadText() {
    for (let text in Assets.Text) {
      if (!this.game.cache.checkTextKey(Assets.Text[text].key)) {
        this.game.load.text(Assets.Text[text].key, Assets.Text[text].txt, true)
      }
    }
  }

  private static loadScripts() {
    for (let script in Assets.Scripts) {
      this.game.load.script(Assets.Scripts[script].key, Assets.Scripts[script].js)
    }
  }

  private static loadShaders() {
    for (let shader in Assets.Shaders) {
      if (!this.game.cache.checkShaderKey(Assets.Shaders[shader].key)) {
        this.game.load.shader(Assets.Shaders[shader].key, Assets.Shaders[shader].frag, true)
      }
    }
  }

  public static loadAllAssets(game: Phaser.Game, onComplete?: Function, onCompleteContext?: any) {
    this.game = game

    if (onComplete) {
      this.game.load.onLoadComplete.addOnce(onComplete, onCompleteContext)
    }

    this.loadImages()
    this.loadSpritesheets()
    this.loadAtlases()
    this.loadAudio()
    this.loadAudiosprites()
    this.loadBitmapFonts()
    this.loadJSON()
    this.loadXML()
    this.loadText()
    this.loadScripts()
    this.loadShaders()
  }

  public static waitForSoundDecoding(onComplete: Function, onCompleteContext?: any) {
    if (this.soundKeys.length > 0) {
      this.game.sound.setDecodedCallback(this.soundKeys, onComplete, onCompleteContext)
    } else {
      onComplete.call(onCompleteContext)
    }
  }
}
