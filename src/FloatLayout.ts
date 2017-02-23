// This file is part of phosphor-float-area, copyright (C) 2017 BusFaster Ltd.
// Released under the MIT license, see LICENSE.

import { Message, MessageLoop } from '@phosphor/messaging';
import { IIterator, empty, iter } from '@phosphor/algorithm';
import { Widget, Layout } from '@phosphor/widgets';

export class FloatLayout extends Layout {
	constructor(options: FloatLayout.Options = {}) {
		super();
	}

	iter(): IIterator<Widget> {
		return iter(this.widgetList);
	}

	addWidget(widget: Widget, options: FloatLayout.AddOptions = {}) {
		widget.parent = this.parent;

		this.widgetList.push(widget);

		this.attachWidget(widget);

		// Send fit-request to parent (Layout class will catch it).
		this.parent!.fit();
	}

	removeWidget(widget: Widget) {
		if(this.parent) {
			// this.detachWidget(widget);
			this.parent.fit();
		}
	}

	protected onFitRequest(msg: Message): void {
		if(!this.parent!.isAttached) return;

		// TODO: Calculate required size to fit children.
		// See DockLayout._fit

		MessageLoop.sendMessage(this.parent!, Widget.Msg.UpdateRequest);
	}

	protected onUpdateRequest(msg: Message): void {
		if(this.parent!.isVisible) this.update();
	}

	update() {
		for(let widget of this.widgetList) {
			this.updateWidget(widget);
		}
	}

	protected attachWidget(widget: Widget): void {
		if (this.parent!.node == widget.node.parentNode) return;

		Widget.prepareGeometry(widget);

		if (this.parent!.isAttached) {
			MessageLoop.sendMessage(widget, Widget.Msg.BeforeAttach);
		}

		this.parent!.node.appendChild(widget.node);

		if (this.parent!.isAttached) {
			MessageLoop.sendMessage(widget, Widget.Msg.AfterAttach);
		}
	}

	updateWidget(widget: Widget) {
		Widget.setGeometry(widget, 0, 0, 200, 200);
	}

	private widgetList: Widget[] = [];
}

export namespace FloatLayout {
	export interface Options {
	}

	export interface AddOptions {
	}
}
