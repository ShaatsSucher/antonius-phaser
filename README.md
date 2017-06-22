# Antonius (phaser edition)
The post-Game-Jam-version of the [antonius project][antonius], relying on [phaser][phaserio] instead of directly on [PixiJS][pixijs].

Based on the [PhaserNPMWebpackTypeScriptStarterProject][phaser-starter] by [Richard Roylance][rroylance].

# Setup:
## 0. Install Git:
[GIT Installation Instructions and Links][git-scm]

Alternatively, if you're not too fond of the terminal, find yourself a
graphical git tool.

## 1. Clone this repo:
Navigate into your workspace directory and run

```git clone https://github.com/ShaatsSucher/antonius-phaser.git```

## 2. Install node.js and npm:
(npm is included and installed with node.js)

[NodeJS Installation Instructions and Links][nodejs]

## 3. Install dependencies:
Navigate to the cloned repo’s directory and run

```npm install```

## 4. Run the dev server:
Run to use the dev build while developing:

```npm run server:dev```

This will run a server that serves your built game straight to the browser and
will be built and reloaded automatically anytime a change is detected.

## Build for testing/developing/debugging:
Run:

```npm run build:dev```

This will build the game with a few caveats;
- A compile time flag, DEBUG, set to true; allowing you to include or not
  include certain code depending on if it's DEBUG build or not.
- The resulting game.js will not be minified

## Build for release:
Run:

```npm run build:dist```

This will build the game with a few caveats;
- The compile time flag, DEBUG, set to false; allowing you to include or not
  include certain code depending on if it's DEBUG build or not.
- The resulting game.min.js will be minified



[antonius]: https://github.com/ShaatsSucher/antonius
[phaserio]: http://phaser.io/
[pixijs]: http://www.pixijs.com/
[git-scm]: https://git-scm.com/book/en/v2/Getting-Started-Installing-Git
[nodejs]: https://nodejs.org/en/
[phaser-starter]: https://github.com/rroylance/phaser-npm-webpack-typescript-starter-project
[rroylance]: https://github.com/rroylance
