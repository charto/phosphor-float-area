// This file is part of phosphor-float-area, copyright (C) 2017 BusFaster Ltd.
// Released under the MIT license, see LICENSE.

import { IIterator, empty } from '@phosphor/algorithm';
import { Widget, Layout } from '@phosphor/widgets';

export class FloatLayout extends Layout {
	constructor(options: FloatLayout.Options = {}) {
		super();
	}

	iter(): IIterator<Widget> {
		return(empty<Widget>());
	}

	addWidget(widget: Widget, options: FloatLayout.AddOptions = {}) {
	}

	removeWidget(widget: Widget) {
	}
}

export namespace FloatLayout {
	export interface Options {
	}

	export interface AddOptions {
	}
}
