// This file is part of phosphor-float-area, copyright (C) 2017 BusFaster Ltd.
// Released under the MIT license, see LICENSE.

import { Message, MessageLoop, ConflatableMessage } from '@phosphor/messaging';
import { Widget, LayoutItem } from '@phosphor/widgets';

import { DialogUpdateMessage, DialogRaiseMessage } from './DialogMessage';
import { DialogLayout } from './DialogLayout';

/** Size and position information for drag events to handle move and resize. */

interface DragData {
	/** Flag whether drag causes horizontal movement. */
	moveX: 0 | 1;
	/** Flag whether drag causes vertical movement. */
	moveY: 0 | 1;
	/** Correlation between horizontal change in mouse position and dialog size. */
	resizeX: 0 | 1 | -1;
	/** Correlation between vertical change in mouse position and dialog size. */
	resizeY: 0 | 1 | -1;

	/** Horizontal offset from mouse to dialog position. */
	offsetX: number;
	/** Vertical offset from mouse to dialog position. */
	offsetY: number;
	startWidth: number;
	startHeight: number;
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
		this.node.addEventListener('click', this);
		this.node.addEventListener('mousedown', this);
	}

	protected onAfterDetach(msg: Message) {
		this.node.removeEventListener('click', this);
		this.node.removeEventListener('mousedown', this);
	}

	handleEvent(event: Event) {
		const mouseEvent = event as MouseEvent;
		switch(event.type) {
			case 'click':
				if(this.handleClick(mouseEvent)) break;
				return;
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

	handleClick(event: MouseEvent) {
		if(event.button != 0) return(false);

		MessageLoop.postMessage(this.parent!, new DialogRaiseMessage(this, event));

		return(false);
	}

	handleMouseDown(event: MouseEvent) {
		if(event.button != 0) return(false);

		let moveX: 0 | 1 = 0;
		let moveY: 0 | 1 = 0;
		let resizeX: 0 | 1 | -1 = 0;
		let resizeY: 0 | 1 | -1 = 0;
		const target = event.target as Element;

		if(target.parentNode == this.node) {
			const match = target.className.match(/charto-Dialog-resize-([ns]?)([ew]?)( |$)/);
			if(!match) return(false);

			// Vertical resize.
			if(match[1]) {
				if(match[1] == 'n') {
					moveY = 1;
					resizeY = -1;
				} else resizeY = 1;
			}

			// Horizontal resize.
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
			// Move the dialog.
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
			offsetX: node.offsetLeft - event.clientX * moveX,
			offsetY: node.offsetTop - event.clientY * moveY,
			startWidth: node.offsetWidth - event.clientX * resizeX,
			startHeight: node.offsetHeight - event.clientY * resizeY
		};

		return(true);
	}

	handleMouseMove(event: MouseEvent) {
		const drag = this.drag;
		if(!drag) return;

		MessageLoop.postMessage(this.parent!, new DialogUpdateMessage(
			this,
			drag.offsetX + event.clientX * drag.moveX,
			drag.offsetY + event.clientY * drag.moveY,
			drag.startWidth + event.clientX * drag.resizeX,
			drag.startHeight + event.clientY * drag.resizeY,
			event
		));
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
