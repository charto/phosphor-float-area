// This file is part of phosphor-float-area, copyright (C) 2017 BusFaster Ltd.
// Released under the MIT license, see LICENSE.

import { Message } from '@phosphor/messaging';
import { ElementExt } from '@phosphor/domutils';
import { IDragEvent } from '@phosphor/dragdrop';
import { Widget, DockPanel } from '@phosphor/widgets';

import { FloatLayout } from './FloatLayout';

export class FloatArea extends Widget {
	constructor(options: FloatArea.Options = {}) {
		super({ node: FloatArea.createNode() });

		this.addClass('charto-float-area');
		this.addClass('charto-content');

		this.layout = new FloatLayout();

		if(options.overlay) {
			// Re-use an existing transparent overlay.
			// Pass it to a parent DockPanel first.
			this.overlay = options.overlay;
			this.overlayParent = this.overlay.node.parentNode as HTMLElement;
			this.ownOverlay = false;
		} else {
			// Create a new transparent overlay inside this widget.
			this.overlay = new DockPanel.Overlay();
			this.overlay.node.classList.add('charto-mod-overlay-jump');
			this.node.appendChild(this.overlay.node);
			this.overlayParent = this.node;
			this.ownOverlay = true;
		}

		const parentBox = ElementExt.boxSizing(this.overlayParent);
		this.edgeWidth = parentBox.borderLeft + parentBox.borderRight;
		this.edgeHeight = parentBox.borderTop + parentBox.borderBottom;
	}

	static createNode(): HTMLElement {
		const node = document.createElement('div');
		return(node);
	}

	protected onBeforeAttach(msg: Message): void {
		this.node.addEventListener('p-dragenter', this);
		this.node.addEventListener('p-dragleave', this);
		this.node.addEventListener('p-dragover', this);
		this.node.addEventListener('p-drop', this);
//		this.node.addEventListener('mousedown', this);
	}

	protected onAfterDetach(msg: Message): void {
		this.node.removeEventListener('p-dragenter', this);
		this.node.removeEventListener('p-dragleave', this);
		this.node.removeEventListener('p-dragover', this);
		this.node.removeEventListener('p-drop', this);
	}

	handleEvent(event: Event): void {
		if(event.type != 'p-dragleave') {
			// Eat all events except dragleave
			// (so overlay's parent can still see if it's time to hide it).
			event.preventDefault();
			event.stopPropagation();
		}

		const dragEvent = event as IDragEvent;

		switch(event.type) {
			case 'p-dragenter':
				if(!dragEvent.mimeData.hasData('application/vnd.phosphor.widget-factory')) break;

				if(this.ownOverlay && this.node.parentNode) {
					// Dispatch a new event with out of bounds coordinates
					// to get parent DockPanel hide any visible overlay.

					const outOfBoundsEvent = document.createEvent('MouseEvent');

					outOfBoundsEvent.initMouseEvent(
						'p-dragover', true, true, window, 0,
						dragEvent.screenX, dragEvent.screenY,
						-1, -1,
						dragEvent.ctrlKey, dragEvent.altKey,
						dragEvent.shiftKey, dragEvent.metaKey,
						dragEvent.button, dragEvent.relatedTarget
					);

					this.node.parentNode.dispatchEvent(outOfBoundsEvent);
					return;
				} else if(!this.ownOverlay) {
					// Probably re-using a DockPanel's overlay,
					// so disable animated transitions in its movement.
					this.overlay.node.classList.add('charto-mod-overlay-jump');
				}

				const dragImage = document.body.querySelector('.p-mod-drag-image') as HTMLElement;
				if(dragImage) {
					const imageRect = dragImage.getBoundingClientRect();
					this.dragImageOffsetX = dragImage.offsetLeft - imageRect.left;
					this.dragImageOffsetY = dragImage.offsetTop - imageRect.top;
					this.dragImageHeight = dragImage.offsetHeight;
				}
				break;
			case 'p-dragleave':
				const related = dragEvent.relatedTarget as HTMLElement;

				if(!this.ownOverlay && (!related || !this.node.contains(related))) {
					// Mouse left the bounds of this widget.
					// Enable animated transitions in overlay movement.
					this.overlay.node.classList.remove('charto-mod-overlay-jump');
				}
				break;
			case 'p-dragover':
				dragEvent.dropAction = dragEvent.proposedAction;

				const rect = this.node.getBoundingClientRect();
				const parentRect = this.overlayParent.getBoundingClientRect();

				const left = dragEvent.clientX - parentRect.left - this.dragImageOffsetX;
				const top = dragEvent.clientY - parentRect.top - this.dragImageOffsetY + this.dragImageHeight;
				let width: number;
				let height: number;

				const goldenRatio = 0.618;

				// Compute initial floating panel size so its longer dimension
				// is half that of the area it's floating over.
				if(rect.width < rect.height) {
					width = rect.width / 2;
					height = width * goldenRatio;
				} else {
					height = rect.height / 2;
					width = height / goldenRatio;
				}

				const right = parentRect.width - width - left - this.edgeWidth;
				const bottom = parentRect.height - height - top - this.edgeHeight;

				this.overlay.show({
					mouseX: dragEvent.clientX,
					mouseY: dragEvent.clientY,
					parentRect: rect,
					top, left, right, bottom, width, height
				});
				break;
			case 'p-drop':
				this.overlay.hide(0);

				const factory = dragEvent.mimeData.getData('application/vnd.phosphor.widget-factory');
				const widget = (typeof(factory) == 'function' && factory());

				// Ensure the dragged widget is known.
				if(!(widget instanceof Widget) || widget == this) {
					dragEvent.dropAction = 'none';
					return;
				}

				// Take ownership of the dragged widget.
				this.addWidget(widget);

				// Accept the drag.
				dragEvent.dropAction = dragEvent.proposedAction;

				break;
		}
	}

	addWidget(widget: Widget, options: FloatLayout.AddOptions = {}): void {
		(this.layout as FloatLayout).addWidget(widget, options);
	}

	/** Transparent overlay indicating position of dragged widget if dropped. */
	overlay: DockPanel.IOverlay;
	/** Parent DOM node of the overlay. */
	overlayParent: HTMLElement;
	/** Flag whether the overlay was created by this widget. */
	ownOverlay: boolean;
	/** Horizontal padding of overlayParent in pixels. */
	edgeWidth: number;
	/** Vertical padding of overlayParent in pixels. */
	edgeHeight: number;

	dragImageOffsetX = 0;
	dragImageOffsetY = 0;
	dragImageHeight = 0;
}

export namespace FloatArea {
	export interface Options {
		overlay?: DockPanel.IOverlay;
	}

	interface EventWidget extends Widget {
		handleEvent(event: Event): void;
	}

	export interface WidgetConstructor {
		new(...args: any[]): Widget;
	}

	/** Apply a mixin to make a widget class accept or reject drag events
	  * and pass them to parents. */

	export function setDropTarget<Constructor extends WidgetConstructor>(Widget: Constructor, active = true) {
		const proto = Widget.prototype;
		const onBeforeAttach = proto.onBeforeAttach;
		const onAfterDetach = proto.onAfterDetach;
		const handleEvent = proto.handleEvent;

		proto.onBeforeAttach = function(this: EventWidget, msg: Message) {
			this.node.addEventListener('p-dragenter', this);
			if(onBeforeAttach) onBeforeAttach.apply(this, arguments);
		};

		proto.onAfterDetach = function(this: EventWidget, msg: Message) {
			this.node.removeEventListener('p-dragenter', this);
			if(onAfterDetach) onAfterDetach.apply(this, arguments);
		};

		proto.handleEvent = function(this: EventWidget, event: Event) {
			if(
				event.type == 'p-dragenter' &&
				(event as IDragEvent).mimeData.hasData('application/vnd.phosphor.widget-factory')
			) {
				if(active) {
					// Stop enter event propagation to receive other drag events.
					event.preventDefault();
					event.stopPropagation();
				}
			} else if(handleEvent) {
				handleEvent.apply(this, arguments);
			}
		}
	}
}
