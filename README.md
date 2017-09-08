phosphor-float-area
===================

Draggable, dockable, resizable, floating, tabbed `Dialog` and `FloatArea` widgets:

![Screen recording](https://raw.githubusercontent.com/charto/phosphor-float-area/gh-pages/demo.gif)

100% Virtual DOM, TypeScript, [PhosphorJS](https://github.com/phosphorjs/phosphor)
based modern JavaScript goodness :cake:

Live demo
---------

[**Try it now!**](https://charto.github.io/phosphor-float-area/)

Alternatively, run the following commands and then open [localhost:8080](http://localhost:8080/) to see it in action:

```
git clone https://github.com/charto/phosphor-float-area.git
cd phosphor-float-area
npm install
npm run prepublish
npm start
```

The demo uses [SystemJS](https://github.com/systemjs/systemjs).
Works directly from the public directory of any HTTP server.
With `compileOnSave` (eg. [`atom-typescript`](https://atom.io/packages/atom-typescript) or
[TypeScript for VS Code](https://github.com/mrcrowl/vscode/releases/tag/13.10.8))
the demo page always stays up to date while editing TypeScript source code.

Usage
-----

```TypeScript
import '@phosphor/dragdrop/style/index.css!';
import '@phosphor/widgets/style/index.css!';
import 'phosphor-float-area/style/index.css!';

import { Widget, DockPanel } from '@phosphor/widgets';
import { FloatArea } from 'phosphor-float-area';

const area = new FloatArea();
const dock = new DockPanel();

dock.addWidget(area);
dock.addWidget(new Widget(), { mode: 'split-left', ref: area });
dock.addWidget(new Widget(), { mode: 'split-right', ref: area });

Widget.attach(dock, document.body);
```

Project structure
-----------------

### `src`

TypeScript source code (git only).

### `style`

CSS rules needed by the widgets.

### `dist`

Compiled JavaScript (ES5) code (npm only).

### `test`

TypeScript source code of demo application (git only).

### `www`

Support files for demo application (git only).

### `bundler`

Bundler and configuration autogenerator for demo application (git only).

Required for demo application to work after referencing new NPM packages in the code.
Updates [`www/config-npm.js`](https://github.com/charto/phosphor-float-area/blob/master/www/config-npm.js).

Usage:

```bash
cd bundler
npm install
npm run bundle
```

Afterwards, the demo will use the static bundle for faster loading.
Remove `dist/bundle.js` to always load the latest code when developing.

License
=======

[The MIT License](https://raw.githubusercontent.com/charto/phosphor-float-area/master/LICENSE)

Copyright (c) 2017 BusFaster Ltd
