// This file is part of phosphor-float-area, copyright (C) 2017 BusFaster Ltd.
// Released under the MIT license, see LICENSE.

import { Message, MessageLoop } from '@phosphor/messaging';
import { IIterator, iter } from '@phosphor/algorithm';
import { ElementExt } from '@phosphor/domutils';
import { Widget, Layout, LayoutItem } from '@phosphor/widgets';

export class SimpleLayout extends Layout {
	iter(): IIterator<Widget> {
		return iter(this.widgetList);
	}

	dispose() {
		for(let item of this.itemList) item.dispose();

		this.itemList.length = 0;

		super.dispose();
	}

	addWidget(widget: Widget) {
		this.widgetList.push(widget);

		return(this.attachWidget(this.widgetList.length - 1, widget));
	}

	removeWidget(widget: Widget) {
		const index = this.widgetList.indexOf(widget);

		this.widgetList.splice(index, 1);

		if(this.parent) {
			this.detachWidget(index, widget);
			this.parent.fit();
		}
	}

	protected detachWidget(index: number, widget: Widget) {
		this.itemList.splice(index, 1);

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
		for(let item of this.itemList) {
			this.updateItem(item, x, y, width, height);
		}
	}

	updateItem(item: LayoutItem, x: number, y: number, width: number, height: number) {}

	protected attachWidget(index: number, widget: Widget) {
		if (this.parent!.node == widget.node.parentNode) return(null);

		const item = new LayoutItem(widget);
		this.itemList[index] = item;

		if(this.parent!.isAttached) {
			MessageLoop.sendMessage(widget, Widget.Msg.BeforeAttach);
		}

		this.parent!.node.appendChild(widget.node);

		if(this.parent!.isAttached) {
			MessageLoop.sendMessage(widget, Widget.Msg.AfterAttach);
		}

		// Send fit-request to parent (Layout class will catch it).
		this.parent!.fit();

		return(item);
	}

	protected widgetList: Widget[] = [];
	protected itemList: LayoutItem[] = [];
}
