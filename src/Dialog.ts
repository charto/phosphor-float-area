// This file is part of phosphor-float-area, copyright (C) 2017 BusFaster Ltd.
// Released under the MIT license, see LICENSE.

import { Message } from '@phosphor/messaging';
import { Widget, LayoutItem } from '@phosphor/widgets';

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

		let moveX = 0;
		let moveY = 0;
		let resizeX = 0;
		let resizeY = 0;
		const target = event.target as Element;

		if(target.parentNode == this.node) {
			const match = target.className.match(/charto-Dialog-resize-([ns]?)([ew]?)( |$)/);
			if(!match) return(false);

			// Resizing the dialog.
			if(match[1]) {
				if(match[1] == 'n') {
					moveY = 1;
					resizeY = -1;
				} else resizeY = 1;
			}

			if(match[2]) {
				if(match[2] == 'w') {
					moveX = 1;
					resizeX = -1;
				} else resizeX = 1;
			}
		} else if(
			target.className == 'p-TabBar-content' &&
			target.parentNode!.parentNode!.parentNode == this.node
		) {
			// Moving the dialog.
			moveX = 1;
			moveY = 1;
		} else return(false);

		this.removeClass('charto-Dialog-mod-dimmable');

		document.addEventListener('mousemove', this, true);
		document.addEventListener('mouseup', this, true);
		document.addEventListener('keydown', this, true);

		const node = this.node;

		this.drag = {
			moveX, moveY, resizeX, resizeY,
			x1: node.offsetLeft - event.clientX * moveX,
			y1: node.offsetTop - event.clientY * moveY,
			w1: node.offsetWidth - event.clientX * resizeX,
			h1: node.offsetHeight - event.clientY * resizeY
		};

		return(true);
	}

	handleMouseMove(event: MouseEvent) {
		const drag = this.drag;
		if(!drag) return;

		if(this.layoutItem) {
			this.layoutItem.update(
				drag.x1 + event.clientX * drag.moveX,
				drag.y1 + event.clientY * drag.moveY,
				drag.w1 + event.clientX * drag.resizeX,
				drag.h1 + event.clientY * drag.resizeY
			);
		}
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

	layoutItem: LayoutItem | null;
}

export namespace Dialog {
	export interface Options {
	}
}
