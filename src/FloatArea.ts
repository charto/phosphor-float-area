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

		this.dockPanel = options.dockPanel;

		if(options.overlay) {
			this.overlay = options.overlay;
			this.overlayParent = this.overlay.node.parentNode as HTMLElement;
			this.ownOverlay = false;
		} else {
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
		event.preventDefault();
		event.stopPropagation();

		const dragEvent = event as IDragEvent;

		switch(event.type) {
			case 'p-dragenter':
				if(dragEvent.mimeData.hasData('application/vnd.phosphor.widget-factory')) {
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
						this.overlay.node.classList.add('charto-mod-overlay-jump');
					}
				}
				break;
			case 'p-dragleave':
				const related = dragEvent.relatedTarget as HTMLElement;

				if(!related || !this.overlayParent.contains(related)) {
					this.overlay.hide(0);
				}

				if(!this.ownOverlay && (!related || !this.node.contains(related))) {
					this.overlay.node.classList.remove('charto-mod-overlay-jump');
				}
				break;
			case 'p-dragover':
				dragEvent.dropAction = dragEvent.proposedAction;

				const rect = this.node.getBoundingClientRect();
				const parentRect = this.overlayParent.getBoundingClientRect();
				const dragImage: HTMLElement = this.dockPanel && (this.dockPanel as any)._drag && (this.dockPanel as any)._drag.dragImage;

				let top = dragEvent.clientY - parentRect.top + dragImage.offsetHeight;
				let left = dragEvent.clientX - parentRect.left;
				let width: number;
				let height: number;

				if(dragImage) {
					// Get drag image offset from mouse position as configured in CSS.
					const transform = window.getComputedStyle(dragImage).transform;
					if(transform) {
						const matrix = transform.split(/[(),]/);
						top += parseFloat(matrix[6] || '0');
						left += parseFloat(matrix[5] || '0');
					}
				}

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
				const widget = typeof(factory) == 'function' && factory();

				if(!(widget instanceof Widget) || widget == this) {
					dragEvent.dropAction = 'none';
					return;
				}

				console.log(widget);
				widget.parent = null;

				dragEvent.dropAction = dragEvent.proposedAction;

				break;
		}
	}

	addWidget(widget: Widget, options: FloatLayout.AddOptions = {}): void {
		(this.layout as FloatLayout).addWidget(widget, options);
	}

	/** Containing DockPanel if passed as an option to the constructor. */
	dockPanel?: DockPanel;
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
}

export namespace FloatArea {
	export interface Options {
		dockPanel?: DockPanel;
		overlay?: DockPanel.IOverlay;
	}
}
