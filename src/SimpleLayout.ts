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
		this.itemMap.forEach(item => item.dispose());
		this.itemMap.clear();

		for(let widget of this.widgetList) widget.dispose();
		super.dispose();
	}

	afterUpdate(handler: () => void) {
		this.updateHandlerList.push(handler);
	}

	addWidget(widget: Widget) {
		let item: LayoutItem | undefined;
		this.widgetList.push(widget);

		if(this.parent) {
			item = this.attachWidget(widget);
			this.parent.fit();
		}

		return(item);
	}

	removeWidget(widget: Widget) {
		this.widgetList.splice(this.widgetList.indexOf(widget), 1);

		if(this.parent) {
			this.detachWidget(widget);
			this.parent.fit();
		}
	}

	protected attachWidget(widget: Widget) {
		if (this.parent!.node == widget.node.parentNode) return;

		const parentAttached = this.parent!.isAttached;

		if(parentAttached) MessageLoop.sendMessage(widget, Widget.Msg.BeforeAttach);

		this.parent!.node.appendChild(widget.node);

		if(parentAttached) MessageLoop.sendMessage(widget, Widget.Msg.AfterAttach);

		const item = new LayoutItem(widget);
		this.itemMap.set(widget, item);

		return(item);
	}

	protected detachWidget(widget: Widget) {
		if (this.parent!.node != widget.node.parentNode) return;

		const parentAttached = this.parent!.isAttached;

		if(parentAttached) MessageLoop.sendMessage(widget, Widget.Msg.BeforeDetach);

		this.parent!.node.removeChild(widget.node);

		if(parentAttached) MessageLoop.sendMessage(widget, Widget.Msg.AfterDetach);

		const item = this.itemMap.get(widget);

		if(item) {
			this.itemMap.delete(widget);
			item.dispose();
		}
	}

	protected onBeforeAttach(msg: Message) {
		super.onBeforeAttach(msg);
		this.parent!.fit();
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

		let count = 0;

		for(let handler of this.updateHandlerList) {
			handler();
			++count;
		}

		if(count) this.updateHandlerList = [];
	}

	updateWidgets(x: number, y: number, width: number, height: number) {
		//for(let item of this.itemList) {
		//	this.updateItem(item, x, y, width, height);
		//}
	}

	updateItem(item: LayoutItem, x: number, y: number, width: number, height: number) {
		item.update(x, y, width, height);
	}

	protected widgetList: Widget[] = [];
	protected itemMap = new Map<Widget, LayoutItem>();

	private updateHandlerList: (() => void)[] = [];


}
