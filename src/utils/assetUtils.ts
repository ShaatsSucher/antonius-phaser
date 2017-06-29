import * as Assets from '../assets'

export class Loader {
  private static game: Phaser.Game = null
  private static soundKeys: string[] = []
  private static soundExtensionsPreference: string[] = SOUND_EXTENSIONS_PREFERENCE

  private static loadImages() {
    for (let imageName of Object.keys(Assets.Images)) {
      const image = Assets.Images[imageName]
      if (!this.game.cache.checkImageKey(image.key)) {
        for (let option of Object.keys(image)) {
          if (option !== 'key') {
            this.game.load.image(
              image.key,
              image[option]
            )
          }
        }
      }
    }
  }

  private static loadSpritesheets() {
    for (let spritesheetName of Object.keys(Assets.Spritesheets)) {
      const spritesheet = Assets.Spritesheets[spritesheetName]

      if (!this.game.cache.checkImageKey(spritesheet.key)) {
        let imageOption = null

        for (let option of Object.keys(spritesheet)) {
          if (option !== 'key' && option !== 'frameWidth'
              && option !== 'frameHeight' && option !== 'frameMax'
              && option !== 'margin' && option !== 'spacing') {
            imageOption = option
          }
        }

        console.dir(spritesheet)

        this.game.load.spritesheet(
          spritesheet.key,
          spritesheet[imageOption],
          spritesheet.frameWidth,
          spritesheet.frameHeight,
          spritesheet.frameMax,
          spritesheet.margin,
          spritesheet.spacing
        )
      }
    }
  }

  private static loadAtlases() {
    for (let atlasName of Object.keys(Assets.Atlases)) {
      const atlas = Assets.Atlases[atlasName]
      if (!this.game.cache.checkImageKey(atlas.key)) {
        let imageOption = null
        let dataOption = null

        for (let option of Object.keys(atlas)) {
          if (option === 'xml' || option === 'jsonArray'
              || option === 'jsonHash') {
            dataOption = option
          } else if (option !== 'key' && option !== 'Frames') {
            imageOption = option
          }
        }

        if (dataOption === 'xml') {
          this.game.load.atlasXML(
            atlas.key,
            atlas[imageOption],
            atlas.xml
          )
        } else if (dataOption === 'jsonArray') {
          this.game.load.atlasJSONArray(
            atlas.key,
            atlas[imageOption],
            atlas.jsonArray
          )
        } else if (dataOption === 'jsonHash') {
          this.game.load.atlasJSONHash(
            atlas.key,
            atlas[imageOption],
            atlas.jsonHash
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
    for (let audioName of Object.keys(Assets.Audio)) {
      const audio = Assets.Audio[audioName]
      let soundName = audio.key
      this.soundKeys.push(soundName)

      if (!this.game.cache.checkSoundKey(soundName)) {
        let audioTypeArray = []

        for (let option of Object.keys(audio)) {
          if (option !== 'key') {
            audioTypeArray.push(audio[option])
          }
        }

        audioTypeArray = this.orderAudioSourceArrayBasedOnSoundExtensionPreference(audioTypeArray)

        this.game.load.audio(soundName, audioTypeArray, true)
      }
    }
  }

  private static loadAudiosprites() {
    for (let audioName of Object.keys(Assets.Audiosprites)) {
      const audio = Assets.Audiosprites[audioName]
      let soundName = audio.key
      this.soundKeys.push(soundName)

      if (!this.game.cache.checkSoundKey(soundName)) {
        let audioTypeArray = []

        for (let option of Object.keys(audio)) {
          if (option !== 'key' && option !== 'json' && option !== 'Sprites') {
            audioTypeArray.push(audio[option])
          }
        }

        audioTypeArray = this.orderAudioSourceArrayBasedOnSoundExtensionPreference(audioTypeArray)

        this.game.load.audiosprite(soundName, audioTypeArray, audio.json, null, true)
      }
    }
  }

  private static loadBitmapFonts() {
    for (let fontName of Object.keys(Assets.BitmapFonts)) {
      const font = Assets.BitmapFonts[fontName]
      if (!this.game.cache.checkBitmapFontKey(font.key)) {
        let imageOption = null
        let dataOption = null

        for (let option of Object.keys(font)) {
          if (option === 'xml' || option === 'fnt') {
            dataOption = option
          } else if (option !== 'key') {
            imageOption = option
          }
        }

        this.game.load.bitmapFont(font.key, font[imageOption], font[dataOption])
      }
    }
  }

  private static loadJSON() {
    for (let jsonName of Object.keys(Assets.Json)) {
      const json = Assets.Json[jsonName]
      if (!this.game.cache.checkJSONKey(json.key)) {
        this.game.load.json(json.key, json.json, true)
      }
    }
  }

  private static loadXML() {
    for (let xmlName of Object.keys(Assets.Xml)) {
      const xml = Assets.Xml[xmlName]
      if (!this.game.cache.checkXMLKey(xml.key)) {
        this.game.load.xml(xml.key, xml.xml, true)
      }
    }
  }

  private static loadText() {
    for (let textName of Object.keys(Assets.Text)) {
      const text = Assets.Text[textName]
      if (!this.game.cache.checkTextKey(text.key)) {
        this.game.load.text(text.key, text.txt, true)
      }
    }
  }

  private static loadScripts() {
    for (let scriptName of Object.keys(Assets.Scripts)) {
      const script = Assets.Scripts[scriptName]
      this.game.load.script(script.key, script.js)
    }
  }

  private static loadShaders() {
    for (let shaderName of Object.keys(Assets.Shaders)) {
      const shader = Assets.Shaders[shaderName]
      if (!this.game.cache.checkShaderKey(shader.key)) {
        this.game.load.shader(shader.key, shader.frag, true)
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
