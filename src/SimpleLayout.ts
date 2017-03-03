// This file is part of phosphor-float-area, copyright (C) 2017 BusFaster Ltd.
// Released under the MIT license, see LICENSE.

import { Message, MessageLoop } from '@phosphor/messaging';
import { IIterator, iter } from '@phosphor/algorithm';
import { ElementExt } from '@phosphor/domutils';
import { Widget, Layout } from '@phosphor/widgets';

export class SimpleLayout extends Layout {
	iter(): IIterator<Widget> {
		return iter(this.widgetList);
	}

	dispose() {
		for(let widget of this.widgetList) widget.dispose();
		super.dispose();
	}

	addWidget(widget: Widget) {
		this.widgetList.push(widget);

		this.attachWidget(widget);

		// Send fit-request to parent (Layout class will catch it).
		this.parent!.fit();
	}

	removeWidget(widget: Widget) {
		if(this.parent) {
			this.detachWidget(widget);
			this.parent.fit();
		}
	}

	protected detachWidget(widget: Widget) {
		const parentAttached = this.parent!.isAttached;

		if(parentAttached) MessageLoop.sendMessage(widget, Widget.Msg.BeforeDetach);

		this.parent!.node.removeChild(widget.node);

		if(parentAttached) MessageLoop.sendMessage(widget, Widget.Msg.AfterDetach);
	}

	protected onFitRequest(msg: Message): void {
		if(this.parent!.isAttached) {
			MessageLoop.sendMessage(this.parent!, Widget.Msg.UpdateRequest);
		}
	}

	protected onUpdateRequest(msg: Message): void {
		if(this.parent!.isVisible) this.update();
	}

	protected onResize(msg: Widget.ResizeMessage): void {
		if(this.parent!.isVisible) this.update(msg.width, msg.height);
	}

	update(width = this.parent!.node.offsetWidth, height = this.parent!.node.offsetHeight) {
		const box = ElementExt.boxSizing(this.parent!.node);

		this.updateWidgets(
			box.paddingTop,
			box.paddingLeft,
			width - box.horizontalSum,
			height - box.verticalSum
		);
	}

	updateWidgets(x: number, y: number, width: number, height: number) {
		for(let widget of this.widgetList) {
			this.updateWidget(widget, x, y, width, height);
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

	updateWidget(widget: Widget, x: number, y: number, width: number, height: number) {}

	protected widgetList: Widget[] = [];
}
