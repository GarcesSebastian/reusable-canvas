import type { RenderEventMap, RenderEventsType } from "../types/RenderProvider";
import type { ListenerCallback } from "../types/RenderProvider";

/**
 * Event provider for render-related events with type-safe event handling
 * Manages event listeners for mouse interactions and shape creation events
 */
export class RenderProvider {
    private _listeners: {
        [K in RenderEventsType]: ListenerCallback<K>[]
    } = {
        "click": [],
        "mousemove": [],
        "mousedown": [],
        "mouseup": [],
        "create": []
    };

    /**
     * Registers an event listener for the specified event type
     * @param event - The event type to listen for
     * @param callback - The callback function to execute when event occurs
     */
    public on(event: "click", callback: ListenerCallback<"click">): void;
    public on(event: "mousemove", callback: ListenerCallback<"mousemove">): void;
    public on(event: "mousedown", callback: ListenerCallback<"mousedown">): void;
    public on(event: "mouseup", callback: ListenerCallback<"mouseup">): void;
    public on(event: "create", callback: ListenerCallback<"create">): void;

    /**
     * Registers an event listener for the specified event type
     * @param event - The event type to listen for
     * @param callback - The callback function to execute when event occurs
     */
    public on<T extends RenderEventsType>(event: T, callback: ListenerCallback<T>): void {
        (this._listeners[event] as ListenerCallback<T>[]).push(callback);
    }

    /**
     * Removes an event listener for the specified event type
     * @param event - The event type to remove listener from
     * @param callback - The callback function to remove
     */
    public off<T extends RenderEventsType>(event: T, callback: ListenerCallback<T>): void {
        const listeners = this._listeners[event] as ListenerCallback<T>[];
        const index = listeners.indexOf(callback);
        if (index > -1) {
            listeners.splice(index, 1);
        }
    }

    /**
     * Emits an event to all registered listeners
     * @param event - The event type to emit
     * @param args - The event arguments to pass to listeners
     */
    public emit<T extends RenderEventsType>(event: T, args: RenderEventMap[T]): void {
        const listeners = this._listeners[event] as ListenerCallback<T>[];
        listeners.forEach((callback) => {
            callback(args);
        });
    }
}