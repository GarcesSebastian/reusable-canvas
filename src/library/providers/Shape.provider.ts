import type { ShapeEventsMap, ShapeEventsType } from "../types/ShapeProvider";
import type { ShapeListenerCallback } from "../types/ShapeProvider";

/**
 * Event provider for shape-related events with type-safe event handling
 * Manages event listeners for shape interactions like clicks, drag operations, and lifecycle events
 */
export class ShapeProvider {
    private _listeners: {
        [K in ShapeEventsType]: ShapeListenerCallback<K>[]
    } = {
        "click": [],
        "dragstart": [],
        "dragend": [],
        "drag": [],
        "destroy": [],
    };

    /**
     * Registers an event listener for the specified shape event type
     * @param event - The shape event type to listen for
     * @param callback - The callback function to execute when event occurs
     */
    public on<T extends ShapeEventsType>(event: T, callback: ShapeListenerCallback<T>): void {
        (this._listeners[event] as ShapeListenerCallback<T>[]).push(callback);
    }

    /**
     * Removes an event listener for the specified shape event type
     * @param event - The shape event type to remove listener from
     * @param callback - The callback function to remove
     */
    public off<T extends ShapeEventsType>(event: T, callback: ShapeListenerCallback<T>): void {
        const listeners = this._listeners[event] as ShapeListenerCallback<T>[];
        const index = listeners.indexOf(callback);
        if (index > -1) {
            listeners.splice(index, 1);
        }
    }

    /**
     * Emits a shape event to all registered listeners
     * @param event - The shape event type to emit
     * @param args - Optional event arguments to pass to listeners
     */
    public emit<T extends ShapeEventsType>(event: T, args?: ShapeEventsMap[T]): void {
        const listeners = this._listeners[event] as ShapeListenerCallback<T>[];
        listeners.forEach((callback) => {
            callback(args);
        });
    }
}