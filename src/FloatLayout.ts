// This file is part of phosphor-float-area, copyright (C) 2017 BusFaster Ltd.
// Released under the MIT license, see LICENSE.

import { Message, MessageLoop, IMessageHandler } from '@phosphor/messaging';
import { IDragEvent } from '@phosphor/dragdrop';
import { ElementExt } from '@phosphor/domutils';
import { Widget, LayoutItem, DockPanel, TabBar } from '@phosphor/widgets';

import { Dialog } from './Dialog';
import { SimpleLayout } from './SimpleLayout';

export class FloatLayoutItem extends LayoutItem {

	updateUser(x: number, y: number, width: number, height: number) {
		this.userX = x;
		this.userY = y;
		this.userWidth = width;
		this.userHeight = height;
	}

	userY: number;
	userX: number;
	userWidth: number;
	userHeight: number;

}

export class FloatLayout extends SimpleLayout<FloatLayoutItem> {

	constructor(options: FloatLayout.Options = {}) {
		super(FloatLayoutItem);
	}

	addWidget(widget: Widget, options: FloatLayout.AddOptions = {}) {
		const dialog = new Dialog();
		const dockPanel = new DockPanel();

		dockPanel.addWidget(widget);
		dialog.addWidget(dockPanel);

		const handleEvent = dockPanel.handleEvent;
		let leaveEventSent = false;

		dockPanel.handleEvent = function(this: DockPanel, event: Event) {
			switch(event.type) {
				case 'p-dragover':
					if(!leaveEventSent && this.node.parentNode) {
						// In case a parent DockPanel is also showing an overlay,
						// send a p-dragleave event to trigger hiding it.
						sendLeaveEvent(event as IDragEvent, this.node.parentNode as HTMLElement);
						leaveEventSent = true;
					}
					break;

				case 'p-dragleave':
					leaveEventSent = false;
					break;
			}

			if(handleEvent) handleEvent.apply(this, arguments);
		}

		dockPanel.parent = dialog;
		dialog.parent = this.parent;

		MessageLoop.installMessageHook(dockPanel, (handler: IMessageHandler, msg: Message) => {
			if(msg.type == 'child-removed' && (msg as Widget.ChildMessage).child instanceof TabBar) {
				// Allow the panel to process the message first.
				setTimeout(() => {
					if(dockPanel.isEmpty) dialog.close();
					// TODO: dispose?
				}, 1);
			}
			// Let the message through.
			return(true);
		});

		const layoutItem = super.addWidget(dialog);

		const box = ElementExt.boxSizing(dialog.node);
		const tabBar = (dockPanel.node.querySelector('.p-TabBar') || {}) as HTMLElement;

		if(layoutItem) {
			this.updateItem(
				layoutItem,
				(options.left || 0) - box.paddingLeft - box.borderLeft,
				(options.top || 0) - box.paddingTop - box.borderTop,
				(options.width || 320) + box.horizontalSum,
				(options.height || 240) + box.verticalSum + (tabBar.offsetHeight || 0)
			);
		}

		return(layoutItem);
	}

	removeWidget(widget: Widget) {
		super.removeWidget(widget);
	}

	onUpdate() {
		const box = this.box;

		// Resize content to match the dialog.
		this.itemMap.forEach(item => this.updateItem(item, item.userX, item.userY, item.userWidth, item.userHeight));
	}

	updateWidget(widget: Widget, x: number, y: number, width: number, height: number) {
		const item = this.itemMap.get(widget);

		if(item) this.updateItem(item, x, y, width, height);
	}

	updateItem(item: FloatLayoutItem, x: number, y: number, width: number, height: number) {
		const box = this.box;

		item.updateUser(x, y, width, height);

		if(x < box.x) x = box.x;
		if(y < box.y) y = box.y;

		if(width > box.width + 2) width = box.width + 2;
		if(height > box.height + 2) height = box.height + 2;

		if(x - box.x - 2 + width > box.width) x = box.x + 2 + box.width - width;
		if(y - box.y - 2 + height > box.height) y = box.y + 2 + box.height - height;

		item.update(x, y, width, height);
	}

	raiseWidget(widget: Widget) {
		this.parent!.node.appendChild(widget.node);
	}

	protected onFitRequest(msg: Message): void {
		// TODO: Calculate required size to fit children.
		// See DockLayout._fit

		super.onFitRequest(msg);
	}

}

/** Dispatch a new p-dragleave event outside any widgets. */
export function sendLeaveEvent(event: IDragEvent, node: HTMLElement) {
	const leaveEvent = document.createEvent('MouseEvent');
	const oob = -1000;

	// Claim that the mouse entered the document body at faraway coordinates,
	// so any event receivers will consider it outside their bounds.

	leaveEvent.initMouseEvent(
		'p-dragleave', true, true, window, 0,
		oob, oob,
		oob, oob,
		event.ctrlKey, event.altKey,
		event.shiftKey, event.metaKey,
		event.button, document.body
	);

	node.dispatchEvent(leaveEvent);
}

export namespace FloatLayout {
	export interface Options {
	}

	export interface AddOptions {
		left?: number;
		top?: number;
		width?: number;
		height?: number;
	}
}
