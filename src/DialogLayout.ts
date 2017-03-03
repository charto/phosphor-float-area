// This file is part of phosphor-float-area, copyright (C) 2017 BusFaster Ltd.
// Released under the MIT license, see LICENSE.

import { Message } from '@phosphor/messaging';
import { Widget } from '@phosphor/widgets';

import { Dialog } from './Dialog';
import { SimpleLayout } from './SimpleLayout';

export class DialogLayout extends SimpleLayout {
	constructor(options: DialogLayout.Options = {}) {
		super();
	}

	addWidget(widget: Widget, options: DialogLayout.AddOptions = {}) {
		super.addWidget(widget);
	}

	removeWidget(widget: Widget) {
		super.removeWidget(widget);
	}

	protected onFitRequest(msg: Message): void {
		// TODO: Calculate required size to fit children.
		// See DockLayout._fit

		super.onFitRequest(msg);
	}

	updateWidget(widget: Widget, x: number, y: number, width: number, height: number) {
		Widget.setGeometry(widget, x, y, width, height);
	}
}

export namespace DialogLayout {
	export interface Options {
	}

	export interface AddOptions {
	}
}
