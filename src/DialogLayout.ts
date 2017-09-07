// This file is part of phosphor-float-area, copyright (C) 2017 BusFaster Ltd.
// Released under the MIT license, see LICENSE.

import { Message } from '@phosphor/messaging';
import { Widget, LayoutItem } from '@phosphor/widgets';

import { Dialog } from './Dialog';
import { SimpleLayout } from './SimpleLayout';

export class DialogLayout extends SimpleLayout {
	constructor(options: DialogLayout.Options = {}) {
		super();
	}

	addWidget(widget: Widget, options: DialogLayout.AddOptions = {}) {
		return(super.addWidget(widget));
	}

	removeWidget(widget: Widget) {
		super.removeWidget(widget);
	}

	protected onFitRequest(msg: Message): void {
		// TODO: Calculate required size to fit children.
		// See DockLayout._fit

		super.onFitRequest(msg);
	}

	updateWidgets(x: number, y: number, width: number, height: number) {
		this.itemMap.forEach(item => this.updateItem(item, x, y, width, height));
	}

	updateItem(item: LayoutItem, x: number, y: number, width: number, height: number) {
		// Resize content to match the dialog.
		item.update(x, y, width, height);
	}
}

export namespace DialogLayout {
	export interface Options {
	}

	export interface AddOptions {
	}
}
