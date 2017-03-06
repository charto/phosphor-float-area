// This file is part of phosphor-float-area, copyright (C) 2017 BusFaster Ltd.
// Released under the MIT license, see LICENSE.

import { Message } from '@phosphor/messaging';
import { Widget } from '@phosphor/widgets';

import { DialogLayout } from './DialogLayout';

interface DragData {
	moveX: number;
	moveY: number;
	resizeX: number;
	resizeY: number;
	x1: number;
	y1: number;
	w1: number;
	h1: number;
}

export class Dialog extends Widget {
	constructor(options: Dialog.Options = {}) {
		super({ node: Dialog.createNode() });

		this.addClass('charto-Dialog');
		this.addClass('charto-Dialog-mod-dimmable');

		for(let classList of 'ns n,ew e,ns s,ew w,nwse nw,nesw ne,nesw sw,nwse se'.split(',')) {
			const content = document.createElement('div');
			content.className = (
				'charto-Dialog-resize ' +
				classList.split(' ').map(
					(resizer: string) => 'charto-Dialog-resize-' + resizer
				).join(' ')
			);
			this.node.appendChild(content);
		}

		this.layout = new DialogLayout();
	}

	static createNode(): HTMLElement {
		const node = document.createElement('div');
		return(node);
	}

	protected onBeforeAttach(msg: Message) {
		this.node.addEventListener('mousedown', this);
	}

	protected onAfterDetach(msg: Message) {
		this.node.removeEventListener('mousedown', this);
	}

	handleEvent(event: Event) {
		const mouseEvent = event as MouseEvent;
		switch(event.type) {
			case 'mousedown':
				if(this.handleMouseDown(mouseEvent)) break;
				return;
			case 'mousemove':
				this.handleMouseMove(mouseEvent);
				break;
			case 'mouseup':
				if(this.handleMouseUp(mouseEvent)) break;
				return;
		}

		event.preventDefault();
		event.stopPropagation();
	}

	handleMouseDown(event: MouseEvent) {
		if(event.button != 0) return(false);

		const drag: DragData = {
			moveX: 0,
			moveY: 0,
			resizeX: 0,
			resizeY: 0,
			x1: this.node.offsetLeft,
			y1: this.node.offsetTop,
			w1: this.node.offsetWidth,
			h1: this.node.offsetHeight
		};

		if(event.target.parentNode == this.node) {
			const match = event.target.className.match(/charto-Dialog-resize-([ns]?)([ew]?)( |$)/);
			if(!match) return(false);

			// Resizing the dialog.
			if(match[1]) {
				if(match[1] == 'n') {
					drag.moveY = 1;
					drag.resizeY = -1;
				} else drag.resizeY = 1;
			}

			if(match[2]) {
				if(match[2] == 'w') {
					drag.moveX = 1;
					drag.resizeX = -1;
				} else drag.resizeX = 1;
			}
		} else if(
			event.target.className == 'p-TabBar-content' &&
			event.target.parentNode.parentNode.parentNode == this.node
		) {
			// Moving the dialog.
			drag.moveX = 1;
			drag.moveY = 1;
		} else return(false);

		drag.x1 -= event.clientX * drag.moveX;
		drag.y1 -= event.clientY * drag.moveY;
		drag.w1 -= event.clientX * drag.resizeX;
		drag.h1 -= event.clientY * drag.resizeY;

		this.removeClass('charto-Dialog-mod-dimmable');

		document.addEventListener('mousemove', this, true);
		document.addEventListener('mouseup', this, true);
		document.addEventListener('keydown', this, true);

		this.drag = drag;

		return(true);
	}

	handleMouseMove(event: MouseEvent) {
		const drag = this.drag;
		if(!drag) return;

		Widget.setGeometry(
			this,
			drag.x1 + event.clientX * drag.moveX,
			drag.y1 + event.clientY * drag.moveY,
			drag.w1 + event.clientX * drag.resizeX,
			drag.h1 + event.clientY * drag.resizeY
		);
	}

	handleMouseUp(event: MouseEvent) {
		if(event.button != 0) return(false);

		this.addClass('charto-Dialog-mod-dimmable');

		document.removeEventListener('mousemove', this, true);
		document.removeEventListener('mouseup', this, true);
		document.removeEventListener('keydown', this, true);
		this.drag = null;

		return(true);
	}

	addWidget(widget: Widget, options: DialogLayout.AddOptions = {}): void {
		(this.layout as DialogLayout).addWidget(widget, options);
	}

	private drag: DragData | null;
}

export namespace Dialog {
	export interface Options {
	}
}
