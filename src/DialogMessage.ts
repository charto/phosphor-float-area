// This file is part of phosphor-float-area, copyright (C) 2017 BusFaster Ltd.
// Released under the MIT license, see LICENSE.

import { Message, ConflatableMessage } from '@phosphor/messaging';

import { Dialog } from './Dialog';

/** Message sent by a dialog, for processing in a parent layout. */

export interface DialogMessage extends Message {

	/** Dialog sending the message. */
	widget: Dialog,
	/** Mouse event causing the message to be sent, if applicable. */
	event?: MouseEvent

}

/** Message sent by a dialog requesting a parent layout to move or resize it. */

export class DialogUpdateMessage extends ConflatableMessage implements DialogMessage {

	constructor(
		/** Dialog to move or resize. */
		public widget: Dialog,
		public x: number,
		public y: number,
		public width: number,
		public height: number,
		/** Mouse event causing the message to be sent, if applicable. */
		public event?: MouseEvent
	) {
		super('dialog-update');
	}

	/** Conflate subsequent update messages to leave only the latest one. */

	conflate(other: DialogUpdateMessage) {
		// Only conflate messages related to the same widget.
		if(this.widget != other.widget) return(false);

		// Copy information from the newer message (which will be discarded).
		this.x = other.x;
		this.y = other.y;
		this.width = other.width;
		this.height = other.height;

		// Accept the conflation.
		return(true);
	}

}

/** Message sent by a dialog requesting a parent layout to raise it
  * over other dialogs in the z-order. */

export class DialogRaiseMessage extends Message implements DialogMessage {

	constructor(
		/** Dialog to raise. */
		public widget: Dialog,
		/** Mouse event causing the message to be sent, if applicable. */
		public event?: MouseEvent
	) {
		super('dialog-raise');
	}

}
