import { Shape } from "../instances/Shape";

export type TransformerEventBlank = {}
export type TransformerEventTemplate = { childs: Shape[] }

export type TransformerEventsMap = {
    "resizestart": TransformerEventTemplate;
    "resize": TransformerEventTemplate;
    "resizeend": TransformerEventTemplate;
    "movestart": TransformerEventTemplate;
    "move": TransformerEventTemplate;
    "moveend": TransformerEventTemplate;
}

export type TransformerEventsType = keyof TransformerEventsMap;
export type TransformerListenerCallback<T extends TransformerEventsType> = (args: TransformerEventsMap[T]) => void;

/**
 * Event provider for shape-related events with type-safe event handling.
 * Manages event listeners for shape interactions like clicks, drag operations, and lifecycle events.
 */
export class TransformerProvider {
    /**
     * Internal map storing arrays of event listeners for each shape event type.
     */
    private _listeners: {
        [K in TransformerEventsType]: TransformerListenerCallback<K>[]
    } = {
        "resizestart": [],
        "resize": [],
        "resizeend": [],
        "movestart": [],
        "move": [],
        "moveend": []
    };

    public on(event: "resizestart", callback: TransformerListenerCallback<"resizestart">): void;
    public on(event: "resize", callback: TransformerListenerCallback<"resize">): void;
    public on(event: "resizeend", callback: TransformerListenerCallback<"resizeend">): void;
    public on(event: "movestart", callback: TransformerListenerCallback<"movestart">): void;
    public on(event: "move", callback: TransformerListenerCallback<"move">): void;
    public on(event: "moveend", callback: TransformerListenerCallback<"moveend">): void;

    /**
     * Registers an event listener for the specified shape event type.
     * @param event - The shape event type to listen for.
     * @param callback - The callback function to execute when the event occurs.
     */
    public on<T extends TransformerEventsType>(event: T, callback: TransformerListenerCallback<T>): void {
        const listeners = this._listeners[event] as TransformerListenerCallback<T>[];
        listeners.push(callback);
    }

    /**
     * Removes an event listener for the specified shape event type.
     * @param event - The shape event type to remove the listener from.
     * @param callback - The callback function to remove.
     */
    public off<T extends TransformerEventsType>(event: T, callback: TransformerListenerCallback<T>): void {
        const listeners = this._listeners[event] as TransformerListenerCallback<T>[];
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
    public emit<T extends TransformerEventsType>(event: T, args: TransformerEventsMap[T]): void {
        const listeners = this._listeners[event] as TransformerListenerCallback<T>[];
        for (const callback of listeners) {
            callback(args);
        }
    }
}
