// This file is part of phosphor-float-area, copyright (C) 2017 BusFaster Ltd.
// Released under the MIT license, see LICENSE.

import { Message, MessageLoop } from '@phosphor/messaging';
import { IIterator, iter } from '@phosphor/algorithm';
import { ElementExt } from '@phosphor/domutils';
import { Widget, Layout, LayoutItem } from '@phosphor/widgets';

export class SimpleLayout<Item extends LayoutItem = LayoutItem> extends Layout {

	constructor(protected Item = LayoutItem as { new(widget: Widget): Item }) {
		super();
	}

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
		this.afterUpdateList.push(handler);
	}

	addWidget(widget: Widget) {
		let item: Item | undefined;
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

		const item = new this.Item(widget);
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

	protected onFitRequest(msg: Message) {
		if(!this.parent!.isAttached) return;

		let minWidth = 0;
		let minHeight = 0;
		let maxWidth = Infinity;
		let maxHeight = Infinity;

		this.itemMap.forEach(item => {
			item.fit();
			minWidth = Math.max(minWidth, item.minWidth);
			minHeight = Math.max(minHeight, item.minHeight);
			maxWidth = Math.min(maxWidth, item.maxWidth);
			maxHeight = Math.min(maxHeight, item.maxHeight);
		});

		this.updateBox();
		const extraWidth = this.box.outerWidth - this.box.innerWidth;
		const extraHeight = this.box.outerHeight - this.box.innerHeight;
		const style = this.parent!.node.style;

		minWidth += extraWidth;
		minHeight += extraHeight;
		maxWidth += extraWidth;
		maxHeight += extraHeight;

		style.minWidth = minWidth + 'px';
		style.minHeight = minHeight + 'px';
		style.maxWidth = maxWidth + 'px';
		style.maxHeight = maxHeight + 'px';

		this.isUpdated = false;

		if(this.parent!.parent) {
			MessageLoop.sendMessage(this.parent!.parent!, Widget.Msg.FitRequest);
		}

		if(!this.isUpdated) {
			MessageLoop.sendMessage(this.parent!, Widget.Msg.UpdateRequest);
		}
	}

	protected onUpdateRequest(msg: Message): void {
		if(this.parent!.isVisible) this.update();
	}

	protected onResize(msg: Widget.ResizeMessage): void {
		if(this.parent!.isVisible) this.update(msg.width, msg.height);
	}

	updateBox(width = this.parent!.node.offsetWidth, height = this.parent!.node.offsetHeight) {
		const box = this.box;
		const sizing = ElementExt.boxSizing(this.parent!.node);

		box.x = sizing.paddingLeft,
		box.y = sizing.paddingTop,
		box.innerWidth = width - sizing.horizontalSum;
		box.innerHeight = height - sizing.verticalSum;
		box.outerWidth = width;
		box.outerHeight = height;
	}

	update(width?: number, height?: number) {
		this.isUpdated = true;

		this.updateBox(width, height);

		this.onUpdate();

		if(this.afterUpdateList.length) {
			for(let handler of this.afterUpdateList) handler();

			this.afterUpdateList = [];
		}
	}

	onUpdate() {}

	updateItem(item: Item, x: number, y: number, width: number, height: number) {
		item.update(x, y, width, height);
	}

	protected box = { x: 0, y: 0, innerWidth: 0, innerHeight: 0, outerWidth: 0, outerHeight: 0 };

	protected widgetList: Widget[] = [];
	protected itemMap = new Map<Widget, Item>();

	private afterUpdateList: (() => void)[] = [];

	protected isUpdated = true;

}
