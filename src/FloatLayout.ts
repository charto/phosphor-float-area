// This file is part of phosphor-float-area, copyright (C) 2017 BusFaster Ltd.
// Released under the MIT license, see LICENSE.

import { Message, MessageLoop, IMessageHandler } from '@phosphor/messaging';
import { Widget, DockPanel, TabBar } from '@phosphor/widgets';

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

		Widget.setGeometry(
			dialog,
			options.left || 0,
			options.top || 0,
			options.width || 320,
			options.height || 240
		);

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

		super.addWidget(dialog);
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
