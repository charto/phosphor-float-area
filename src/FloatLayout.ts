// This file is part of phosphor-float-area, copyright (C) 2017 BusFaster Ltd.
// Released under the MIT license, see LICENSE.

import { Message, MessageLoop, IMessageHandler } from '@phosphor/messaging';
import { ElementExt } from '@phosphor/domutils';
import { Widget, LayoutItem, DockPanel, TabBar } from '@phosphor/widgets';

import { Dialog } from './Dialog';
import { SimpleLayout } from './SimpleLayout';

export class FloatLayout extends SimpleLayout {
	constructor(options: FloatLayout.Options = {}) {
		super();
	}

	addWidget(widget: Widget, options: FloatLayout.AddOptions = {}) {
		const dialog = new Dialog();
		const dockPanel = new DockPanel();

		dockPanel.addWidget(widget);
		dialog.addWidget(dockPanel);

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

		dialog.layoutItem = layoutItem;

		const box = ElementExt.boxSizing(dialog.node);
		const tabBar = (dockPanel.node.querySelector('.p-TabBar') || {}) as HTMLElement;

		if(layoutItem) {
			layoutItem.update(
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

	protected onFitRequest(msg: Message): void {
		// TODO: Calculate required size to fit children.
		// See DockLayout._fit

		super.onFitRequest(msg);
	}

	updateWidget(widget: Widget) {
		// Widget.setGeometry(widget, 0, 0, 200, 200);
	}
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
