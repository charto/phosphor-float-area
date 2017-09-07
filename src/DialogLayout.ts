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

	onUpdate() {
		const box = this.box;

		// Resize content to match the dialog.
		this.itemMap.forEach(item => this.updateItem(item, box.x, box.y, box.innerWidth, box.innerHeight));
	}

}

export namespace DialogLayout {
	export interface Options {
	}

	export interface AddOptions {
	}
}
