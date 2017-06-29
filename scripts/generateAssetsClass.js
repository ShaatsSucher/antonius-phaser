#!/usr/bin/env node
/*
 * This is a complete rewrite of the original asset generation script and is absolutetly not
 * compatible with the old one.
 *
 * I rewrote it to produce a somewhat saner assets.ts file, since I kept running into trouble with
 * the old generation script, that created classes for each and every asset in the project, which
 * didn't play very well with es6.
 * This new approach stores all the data in namespaces containing constants for every asset. They
 * are easily iterated and since we don't use classes, webpack is okay with using es6, it appears.
 *
 * Old style:
 * export namespace [AssetGroup] {
 *   export class [AssetGroup][AssetName] {
 *     static getName(): string { return '[assetKey]'; }
 *     // Other asset-specific properties
 *   }
 * }
 *
 * New style:
 * export namespace [AssetGroup] {
 *   export const [AssetName] { // because why mention the AssetGroup again?
 *     key: '[assetKey]',
 *     // Other asset-specific properties
 *   }
 * }
 *
 * Also, the whole thing is written in a functional way, which I find to be better. But then again,
 * I'm much of a functional programming fan, so your mileage may vary.
 *
 * Enjoy.
 */

const outFile = 'src/assets.ts'

const commander = require('commander')
const fs = require('fs')
const shell = require('shelljs')
const webpack = require('webpack')
const xml2js = require('xml2js')

commander
  .option('--dev', 'Use webpack.dev.config.js for some values, excluding this will use webpack.dist.config.js (currently only GOOGLE_WEB_FONTS is being used).')
  .parse(process.argv)

const webpackConfig = require(`../webpack.${commander.dev ? 'dev' : 'dist'}.config.js`)

const audioExtensions = ['aac', 'ac3', 'caf', 'flac', 'm4a', 'mp3', 'mp4', 'ogg', 'wav', 'webm']
const imageExtensions = ['bmp', 'gif', 'jpg', 'jpeg', 'png', 'webp']
const fontExtensions = ['eot', 'otf', 'svg', 'ttf', 'woff', 'woff2']
const bitmapFontExtensions = ['xml', 'fnt']
const jsonExtensions = ['json']
const xmlExtensions = ['xml']
const textExtensions = ['txt']
const scriptExtensions = ['js']
const shaderExtensions = ['frag']

function toCamelCase(str) {
    return str.replace(/[^A-Za-z0-9]/g, ' ').replace(/^\w|[A-Z]|\b\w|\s+/g, function (match, index) {
        if ((+match === 0 && match !== '0') || match === '-' || match === '.') {
            return ''
        }
        return index === 0 ? match.toLowerCase() : match.toUpperCase()
    })
}

function toPascalCase(str) {
    let camelCase = toCamelCase(str)

    return camelCase[0].toUpperCase() + camelCase.substr(1)
}

function appendAssetClassLines(lines) {
  shell.ShellString(lines.join('\n')).to(outFile)
}

function indent(line) {
  return Array.isArray(line) ? line.map(indent) : `  ${line}`
}

function autoIndent(line, depth = -1) {
  return Array.isArray(line) ? line.map(l => autoIndent(l, depth + 1)) : Array(depth + 1).join('  ') + line
}

/**
 * Flattens an array containing elements and arrays with nested elements.
 *
 * @example
 * flatten(['a', ['b', 'c', ['d']], [[['e']]]]) // ['a', 'b', 'c', 'd', 'e']
 */
function flatten(possiblyNestedArray) {
  return possiblyNestedArray.reduce((result, element) => {
    if (Array.isArray(element)) {
      return result.concat(flatten(element))
    } else {
      return result.concat(element)
    }
  }, [])
}

function getLastElement(possiblyNestedArray) {
  const lastElement = possiblyNestedArray[possiblyNestedArray.length - 1]
  return Array.isArray(lastElement) ? getLastElement(lastElement) : lastElement
}

function isLastChild(index, object) {
  return index >= Object.keys(object).length - 1
}

function mapAllButLast(array, transform, step = 1) {
  return array.map((item, index, arr) => {
    if ((index + 1) % step !== 0 || index >= arr.length - 1) {
      return item
    } else {
      return transform(item)
    }
  })
}

function isPrimitive(value) {
  const type = typeof value
  return type === 'string' || type === 'bool' || type === 'number'
}

function commaSeparate(lines, step = 1) {
  return mapAllButLast(lines, e => e !== '' && isPrimitive(e) && !e.endsWith('{') ? `${e},` : e, step)
}

const gameAssets = { }
shell.ls('assets/**/*.*').forEach(file => {
  const filePath = file.replace('assets/', '').split('.')
  gameAssets[filePath[0]] = (gameAssets[filePath[0]] || []).concat(filePath.slice(1))
})

const loaderTypes = {
  images: { },
  spritesheets: { },
  atlases: { },
  audio: { },
  audiosprites: { },
  customWebFonts: { },
  bitmapFonts: { },
  json: { },
  xml: { },
  text: { },
  scripts: { },
  shaders: { },
  misc: { },
  googleWebFonts: JSON.parse(
    webpackConfig.plugins[webpackConfig.plugins.findIndex(element =>
      element instanceof webpack.DefinePlugin
    )].definitions.GOOGLE_WEB_FONTS
  ).reduce((a, e) => { a[e] = e; return a }, {  })
}

function overlap(array1, array2) {
  return array1.findIndex(item => array2.indexOf(item) !== -1) !== -1
}

Object.keys(gameAssets).forEach(assetPath => {
  const assetExtensions = gameAssets[assetPath]

  const isImage = overlap(imageExtensions, assetExtensions)
  const isAudio = overlap(audioExtensions, assetExtensions)
  const isFont = overlap(fontExtensions, assetExtensions)
  const isJSON = overlap(jsonExtensions, assetExtensions)
  const isXML = overlap(xmlExtensions, assetExtensions)
  const isText = overlap(textExtensions, assetExtensions)
  const isScript = overlap(scriptExtensions, assetExtensions)
  const isShader = overlap(shaderExtensions, assetExtensions)
  const isBitmapFont = overlap(bitmapFontExtensions, assetExtensions)
      && assetExtensions.reduce((acc, ext) => {
        return acc || (shell.grep(/^[\s\S]*?<font>/g, (`./assets/${assetPath}.${ext}`)).length > 1)
      }, false)

  let type
  if (isBitmapFont && isImage) {
    type = loaderTypes.bitmapFonts
  } else if (isAudio) {
    if (isJSON) {
      type = loaderTypes.audiosprites
    } else {
      type = loaderTypes.audio
    }
  } else if (isImage) {
    if (isJSON || isXML) {
      type = loaderTypes.atlases
    } else {
      if (assetExtensions[0].match(/\[(-?\d+,?)+\]/)) {
        type = loaderTypes.spritesheets
      } else {
        type = loaderTypes.images
      }
    }
  } else if (isFont) {
    type = loaderTypes.customWebFonts
  } else if (isJSON) {
    type = loaderTypes.json
  } else if (isXML) {
    type = loaderTypes.xml
  } else if (isText) {
    type = loaderTypes.text
  } else if (isScript) {
    type = loaderTypes.scripts
  } else if (isShader) {
    type = loaderTypes.shaders
  } else {
    type = loaderTypes.misc
  }
  type[assetPath] = assetExtensions
})

// const loaderTypes = {
//   images: {
//     path1: ['png'],
//     path2: ['png', 'bmp'],
//     path3: ['bmp', 'gif', 'jpg', 'jpeg', 'png', 'webp']
//   },
//   spritesheets: {
//     sheet1: ['[1,2,3]', 'png']
//   },
//   audioSprites: {
//     test1: ['wav', 'json']
//   },
//   googleWebFonts: JSON.parse(
//     webpackConfig.plugins[webpackConfig.plugins.findIndex(element =>
//       element instanceof webpack.DefinePlugin
//     )].definitions.GOOGLE_WEB_FONTS
//   ).reduce((a, e) => { a[e] = e; return a }, {  })
// }

function flatMap(array, transform = e => e) {
  return array.map(transform).reduce((xs, x) => xs.concat(x), [])
}

function namespaceDefinition(type, childFormatter) {
  return Promise.all(Object.keys(loaderTypes[type]).map(
    path => childFormatter(path, loaderTypes[type][path])
  ))
  .then(flatMap)
  .then(types => [
    `export namespace ${toPascalCase(type)} {`,
    types.length > 0 ? types : ['const _empty = true // shut TypeScript the hell up'],
    '}',
    ''
  ])
}

function stripFirstPathComponent(path) {
  return path.substring(path.indexOf('/') + 1)
}

const constDefinition = elementFormatter => (elementPath, element) =>
  Promise.all([elementFormatter(elementPath, element)])
  .then(elements => [
    `export const ${toCamelCase(stripFirstPathComponent(elementPath))} = {`,
    commaSeparate([`key: '${toCamelCase(elementPath)}'`].concat(flatMap(elements))),
    '}'
  ])

function listExtensions(path, extensions) {
  return extensions.map(ext => `${toCamelCase(ext)}: require('assets/${path}.${ext}')`)
}

function defaultDefinition(type) {
  return namespaceDefinition(type, constDefinition(listExtensions))
}

Promise.all([
  [ '/* AUTO GENERATED FILE. DO NOT MODIFY. YOU WILL LOSE YOUR CHANGES ON BUILD. */', '' ],
  defaultDefinition('images'),
  namespaceDefinition('spritesheets', constDefinition((path, ext) => {
    const spriteSheetProperties = ext[0].replace(/[\[\]]/g, '').split(',')
    if (spriteSheetProperties.length < 2 || spriteSheetProperties.length > 5) {
      console.warn(`Invalid number of Spritesheet properties provided for '${path}'.`,
                   'Must have between 2 and 5; [frameWidth, frameHeight, frameMax, margin, spacing]',
                   'frameWidth and frameHeight are required')
    }
    return [
      `${toCamelCase(ext[1])}: require('assets/${path}.${ext[0]}.${ext[1]}')`,
      `frameWidth: ${parseInt(spriteSheetProperties[0] || -1)}`,
      `frameHeight: ${parseInt(spriteSheetProperties[1] || -1)}`,
      `frameMax: ${parseInt(spriteSheetProperties[2] || -1)}`,
      `margin: ${parseInt(spriteSheetProperties[3] || 0)}`,
      `spacing: ${parseInt(spriteSheetProperties[4] || 0)}`
    ]
  })),
  namespaceDefinition('atlases', constDefinition((path, extensions) => {
    const dataTypes = []

    let frameList
    for (let ext of extensions) {
      const jsonExt = jsonExtensions.find(e => e === ext)
      const xmlExt = xmlExtensions.find(e => e === ext)

      if (jsonExt) {
        const json = JSON.parse(fs.readFileSync(`./assets/${path}.${jsonExt}`, 'utf8'))
        if (Array.isArray(json.frames)) {
          dataTypes.push('Array')
          frameList = Promise.resolve(json.frames.map(e => e.filename))
        } else {
          dataTypes.push('Hash')
          frameList = Promise.resolve(Object.keys(json.frames))
        }
      } else if (xmlExt) {
        dataTypes.push('')
        frameList = new Promise((resolve, reject) => {
          (new xml2js.Parser()).parseString(fs.readFileSync(`./assets/${path}.${xmlExt}`, 'utf8'), (err, result) => {
            if (err) return reject(err)
            const subTexture = result['TextureAtlas']['SubTexture']
            resolve(subTexture.map(frame => frame['$'].name))
          })
        })
      } else {
        dataTypes.push('')
      }
    }
    const frames = frameList.then(frames => frames.map((frame, index) => {
      const frameFull = frame
      const indexOfExtension = frameFull.lastIndexOf('.')
      if (indexOfExtension === -1) {
        frame = frameFull
      } else {
        frame = frameFull.substring(0, indexOfExtension)
      }
      return `${toCamelCase(frame)}: '${frameFull}'`
    }))

    const types = extensions.map(
      (ext, index) => `${toCamelCase(ext)}${dataTypes[index]}: require('assets/${path}.${ext}')`
    )
    return frames
    .then(frames =>
      extensions.map(
        (ext, index) => `${toCamelCase(ext)}${dataTypes[index]}: require('assets/${path}.${ext}')`
      ).concat([
        'frames: {',
        commaSeparate(frames),
        '}'
      ])
    )
  })),
  defaultDefinition('audio'),
  namespaceDefinition('audiosprites', constDefinition((path, extensions) => {
    // jsonExt cannot be empty or otherwise the audio file wouldn't have been classified as an
    // audio sprite in the first place
    const jsonExt = extensions.find(ext => jsonExtensions.indexOf(ext) !== -1)
    const json = JSON.parse(fs.readFileSync(`./assets/${path}.${jsonExt}`))
    const sprites = commaSeparate(
      Object.keys(json.spritemap).map(sprite => `${toCamelCase(sprite)}: '${sprite}'`)
    )

    return listExtensions(path, extensions)
    .concat([
      'sprites: {',
      sprites,
      '}'
    ])
  })),
  namespaceDefinition('googleWebFonts', path => [
    `export const ${toCamelCase(path)} = '${path}'`
  ]),
  namespaceDefinition('customWebFonts', constDefinition((path, extensions) => {
    const cssFileData = fs.readFileSync(`assets/${path}.css`, 'utf8')
    const family = /font-family:\s*['"](\w+)['"]/gi.exec(cssFileData)[1]
    return [
      `family: '${family}'`
    ].concat(extensions.map(
      ext => `${toCamelCase(ext)}: require('!file-loader?name=assets/fonts/[name].[ext]!assets/${path}.${ext}')`
    ))
  })),
  defaultDefinition('bitmapFonts'),
  defaultDefinition('json'),
  defaultDefinition('xml'),
  defaultDefinition('text'),
  defaultDefinition('scripts'),
  defaultDefinition('shaders'),
  defaultDefinition('misc')
])
.then(flatMap)
.then(autoIndent)
.then(flatten)
.then(appendAssetClassLines)
