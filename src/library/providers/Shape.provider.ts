import type { ShapeEventsMap, ShapeEventsType } from "../types/ShapeProvider";
import type { ShapeListenerCallback } from "../types/ShapeProvider";

/**
 * Event provider for shape-related events with type-safe event handling.
 * Manages event listeners for shape interactions like clicks, drag operations, and lifecycle events.
 */
export class ShapeProvider {
    /**
     * Internal map storing arrays of event listeners for each shape event type.
     */
    private _listeners: {
        [K in ShapeEventsType]: ShapeListenerCallback<K>[]
    } = {
        "click": [],
        "dblclick": [],
        "dragstart": [],
        "dragend": [],
        "drag": [],
        "input": [],
        "destroy": [],
    };

    public on(event: "click", callback: ShapeListenerCallback<"click">): void;
    public on(event: "dblclick", callback: ShapeListenerCallback<"dblclick">): void;
    public on(event: "dragstart", callback: ShapeListenerCallback<"dragstart">): void;
    public on(event: "dragend", callback: ShapeListenerCallback<"dragend">): void;
    public on(event: "drag", callback: ShapeListenerCallback<"drag">): void;
    public on(event: "input", callback: ShapeListenerCallback<"input">): void;
    public on(event: "destroy", callback: ShapeListenerCallback<"destroy">): void;

    /**
     * Registers an event listener for the specified shape event type.
     * @param event - The shape event type to listen for.
     * @param callback - The callback function to execute when the event occurs.
     */
    public on<T extends ShapeEventsType>(event: T, callback: ShapeListenerCallback<T>): void {
        const listeners = this._listeners[event] as ShapeListenerCallback<T>[];
        listeners.push(callback);
    }

    /**
     * Removes an event listener for the specified shape event type.
     * @param event - The shape event type to remove the listener from.
     * @param callback - The callback function to remove.
     */
    public off<T extends ShapeEventsType>(event: T, callback: ShapeListenerCallback<T>): void {
        const listeners = this._listeners[event] as ShapeListenerCallback<T>[];
        const index = listeners.indexOf(callback);
        if (index !== -1) {
            listeners.splice(index, 1);
        }
    }

    /**
     * Emits a shape event to all registered listeners.
     * @param event - The shape event type to emit.
     * @param args - Event arguments to pass to listeners.
     */
    public emit<T extends ShapeEventsType>(event: T, args: ShapeEventsMap[T]): void {
        const listeners = this._listeners[event] as ShapeListenerCallback<T>[];
        for (const callback of listeners) {
            callback(args);
        }
    }
}
