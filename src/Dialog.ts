// This file is part of phosphor-float-area, copyright (C) 2017 BusFaster Ltd.
// Released under the MIT license, see LICENSE.

import { Message } from '@phosphor/messaging';
import { Widget } from '@phosphor/widgets';

import { DialogLayout } from './DialogLayout';

interface DragData {
	x1: number,
	y1: number
}

export class Dialog extends Widget {
	constructor(options: Dialog.Options = {}) {
		super({ node: Dialog.createNode() });

		this.addClass('charto-Dialog');

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
				if(mouseEvent.button == 0) this.handleMouseDown(mouseEvent);
				break;
			case 'mousemove':
				this.handleMouseMove(mouseEvent);
				break;
			case 'mouseup':
				if(mouseEvent.button == 0) this.handleMouseUp(mouseEvent);
				break;
		}

		event.preventDefault();
		event.stopPropagation();
	}

	handleMouseDown(event: MouseEvent) {
		document.addEventListener('mousemove', this, true);
		document.addEventListener('mouseup', this, true);
		document.addEventListener('keydown', this, true);

		this.drag = {
			x1: this.node.offsetLeft - event.clientX,
			y1: this.node.offsetTop - event.clientY
		};
	}

	handleMouseMove(event: MouseEvent) {
		if(!this.drag) return;

		this.node.style.left = this.drag.x1 + event.clientX + 'px';
		this.node.style.top = this.drag.y1 + event.clientY + 'px';
	}

	handleMouseUp(event: MouseEvent) {
		document.removeEventListener('mousemove', this, true);
		document.removeEventListener('mouseup', this, true);
		document.removeEventListener('keydown', this, true);
		this.drag = null;
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
