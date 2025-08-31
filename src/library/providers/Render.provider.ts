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
        "create": [],
        "undo": [],
        "redo": [],
        "save": [],
        "copy": [],
        "cut": [],
        "paste": [],
        "delete": [],
        "selectAll": [],
        "top": [],
        "bottom": [],
        "front": [],
        "back": [],
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
    public on(event: "undo", callback: ListenerCallback<"undo">): void;
    public on(event: "redo", callback: ListenerCallback<"redo">): void;
    public on(event: "save", callback: ListenerCallback<"save">): void;
    public on(event: "copy", callback: ListenerCallback<"copy">): void;
    public on(event: "cut", callback: ListenerCallback<"cut">): void;
    public on(event: "paste", callback: ListenerCallback<"paste">): void;
    public on(event: "delete", callback: ListenerCallback<"delete">): void;
    public on(event: "selectAll", callback: ListenerCallback<"selectAll">): void;
    public on(event: "top", callback: ListenerCallback<"top">): void;
    public on(event: "bottom", callback: ListenerCallback<"bottom">): void;
    public on(event: "front", callback: ListenerCallback<"front">): void;
    public on(event: "back", callback: ListenerCallback<"back">): void;

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