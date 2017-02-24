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

	protected onBeforeAttach(msg: Message) {
		this.node.addEventListener('p-dragenter', this);
		this.node.addEventListener('p-dragleave', this);
		this.node.addEventListener('p-dragover', this);
		this.node.addEventListener('p-drop', this);
//		this.node.addEventListener('mousedown', this);
	}

	protected onAfterDetach(msg: Message) {
		this.node.removeEventListener('p-dragenter', this);
		this.node.removeEventListener('p-dragleave', this);
		this.node.removeEventListener('p-dragover', this);
		this.node.removeEventListener('p-drop', this);
	}

	handleEvent(event: Event) {
		switch(event.type) {
			case 'p-dragenter':
				// Only handle drag events containing widgets.
				if((event as IDragEvent).mimeData.hasData('application/vnd.phosphor.widget-factory')) {
					this.handleDragEnter(event as IDragEvent);
					break;
				}
				return;
			case 'p-dragleave':
				this.handleDragLeave(event as IDragEvent);

				// Allow dragleave events to bubble up so overlay's parent
				// can see if it's time to hide it.
				return;
			case 'p-dragover':
				this.handleDragOver(event as IDragEvent);
				break;
			case 'p-drop':
				this.handleDrop(event as IDragEvent);
				break;
		}

		// Note: p-dragenter must be eaten to receive other drag events.
		event.preventDefault();
		event.stopPropagation();
	}

	protected handleDragEnter(event: IDragEvent) {
		if(this.ownOverlay) {
			if(this.node.parentNode) {
				// In case a parent DockPanel is also showing an overlay,
				// send a p-dragleave event to trigger hiding it.
				sendLeaveEvent(event, this.node.parentNode as HTMLElement);
			}
		} else {
			// Probably re-using a DockPanel's overlay,
			// so disable animated transitions in its movement.
			this.overlay.node.classList.add('charto-mod-overlay-jump');
		}

		// Equivalent to (dockPanel as any)._drag.dragImage if we had access.
		const dragImage = document.body.querySelector('.p-mod-drag-image') as HTMLElement;

		if(dragImage) {
			const imageRect = dragImage.getBoundingClientRect();
			this.dragImageOffsetX = dragImage.offsetLeft - imageRect.left;
			this.dragImageOffsetY = dragImage.offsetTop - imageRect.top;
			this.dragImageHeight = dragImage.offsetHeight;
		}
	}

	protected handleDragLeave(event: IDragEvent) {
		const related = event.relatedTarget as HTMLElement;

		if(!related || !this.node.contains(related)) {
			// Mouse left the bounds of this widget.
			if(this.ownOverlay) {
				this.overlay.hide(0);
			} else {
				// Enable animated transitions in overlay movement.
				this.overlay.node.classList.remove('charto-mod-overlay-jump');
			}
		}
	}

	protected handleDragOver(event: IDragEvent) {
		const rect = this.node.getBoundingClientRect();
		const parentRect = this.overlayParent.getBoundingClientRect();

		const left = event.clientX - parentRect.left - this.dragImageOffsetX;
		const top = event.clientY - parentRect.top - this.dragImageOffsetY + this.dragImageHeight;
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
			mouseX: event.clientX,
			mouseY: event.clientY,
			parentRect: rect,
			top, left, right, bottom, width, height
		});

		// Tentatively accept the drag.
		event.dropAction = event.proposedAction;
	}

	protected handleDrop(event: IDragEvent) {
		this.overlay.hide(0);

		const factory = event.mimeData.getData('application/vnd.phosphor.widget-factory');
		const widget = (typeof(factory) == 'function' && factory());

		// Ensure the dragged widget is known.
		if(!(widget instanceof Widget) || widget == this) {
			event.dropAction = 'none';
			return;
		}

		// Take ownership of the dragged widget.
		this.addWidget(widget);

		// Accept the drag.
		event.dropAction = event.proposedAction;
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

/** Dispatch a new p-dragleave event outside any widgets. */
function sendLeaveEvent(event: IDragEvent, node: HTMLElement) {
	const leaveEvent = document.createEvent('MouseEvent');
	const oob = -1000;

	// Claim the mouse entered the document body at faraway coordinates,
	// so any event receivers will consider it outside their bounds.

	leaveEvent.initMouseEvent(
		'p-dragleave', true, true, window, 0,
		oob, oob,
		oob, oob,
		event.ctrlKey, event.altKey,
		event.shiftKey, event.metaKey,
		event.button, document.body
	);

	node.dispatchEvent(leaveEvent);
}

export namespace FloatArea {
	export interface Options {
		overlay?: DockPanel.IOverlay;
	}

	interface EventWidget extends Widget {
		handleEvent(event: Event): void;
		leaveEventSent: boolean;
	}

	/** Apply a mixin to make a widget or class request drag events or allow
	  * children to request them. Requested events only get passed to parents.
	  * @param widgetType Where to add mixin.
	  * Can be a widget instance or class prototype.
	  * @param active Flag whether events will be requested and hidden from children. */

	export function setDropTarget<WidgetType extends Widget>(
		widgetType: WidgetType | { new(...args: any[]): WidgetType },
		active = true
	) {
		const target = widgetType instanceof Widget ? widgetType : widgetType.prototype;
		const onBeforeAttach = target.onBeforeAttach;
		const onAfterDetach = target.onAfterDetach;
		const handleEvent = target.handleEvent;

		target.onBeforeAttach = function(this: EventWidget, msg: Message) {
			this.node.addEventListener('p-dragenter', this);
			if(onBeforeAttach) onBeforeAttach.apply(this, arguments);
		};

		target.onAfterDetach = function(this: EventWidget, msg: Message) {
			this.node.removeEventListener('p-dragenter', this);
			if(onAfterDetach) onAfterDetach.apply(this, arguments);
		};

		target.handleEvent = function(this: EventWidget, event: Event) {
			switch(event.type) {
				case 'p-dragenter':
					if((event as IDragEvent).mimeData.hasData('application/vnd.phosphor.widget-factory')) {
						if(active) {
							// Stop enter event propagation to receive other drag events.
							event.preventDefault();
							event.stopPropagation();
						} else return;
					}
					break;
				case 'p-dragover':
					if(!active && !this.leaveEventSent && this.node.parentNode) {
						// In case a parent DockPanel is also showing an overlay,
						// send a p-dragleave event to trigger hiding it.
						sendLeaveEvent(event as IDragEvent, this.node.parentNode as HTMLElement);
						this.leaveEventSent = true;
					}
					break;
				case 'p-dragleave':
					this.leaveEventSent = false;
					break;
			}

			if(handleEvent) handleEvent.apply(this, arguments);
		}
	}
}
