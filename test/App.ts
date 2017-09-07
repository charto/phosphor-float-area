import '@phosphor/dragdrop/style/index.css!';
import '@phosphor/widgets/style/index.css!';
import 'font-awesome/css/font-awesome.min.css!';
import '../style/index.css!';
import '../www/css/content.css!';
import '../www/css/phosphor/index.css!';

import { Widget, DockPanel, TabBar } from '@phosphor/widgets';
import { IDragEvent } from '@phosphor/dragdrop';
import { FloatArea } from '../dist/index';

class AreaWidget extends FloatArea {

	constructor() {
		super();

		this.addClass('charto-content');

		this.content = document.createElement('div');
		this.content.className = 'charto-content-inner';

		this.node.appendChild(this.content);

		this.title.label = 'Main';
		this.title.closable = false;
		this.title.caption = 'Main working area';
	}

	content: HTMLDivElement;

}

class ContentWidget extends Widget {

	static createNode(): HTMLElement {
		const node = document.createElement('div');
		const content = document.createElement('div');
		const input = document.createElement('input');

		content.classList.add('charto-content-inner');

		input.placeholder = 'Placeholder...';
		input.className = 'placeholder';
		content.appendChild(input);
		node.appendChild(content);

		return(node);
	}

	constructor(name: string) {
		super({ node: ContentWidget.createNode() });

		this.addClass('charto-content');
		this.addClass('demo-content');
		this.addClass(name.toLowerCase());

		this.title.label = name;
		this.title.closable = true;
		this.title.caption = 'Description of ' + name;
	}

	content: HTMLDivElement;

}

const overlay = new DockPanel.Overlay();
const dockPanel = new DockPanel({ overlay });
dockPanel.id = 'main';

const area = new AreaWidget();
const red = new ContentWidget('Red');
const yellow = new ContentWidget('Yellow');
const blue = new ContentWidget('Blue');
dockPanel.addWidget(area);
dockPanel.addWidget(red, { mode: 'split-left', ref: area });
dockPanel.addWidget(yellow, { mode: 'split-bottom', ref: red });
dockPanel.addWidget(blue, { mode: 'split-right', ref: area });

Widget.attach(dockPanel, document.body);

window.onresize = () => { dockPanel.update(); };
