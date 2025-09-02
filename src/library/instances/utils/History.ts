import { Render } from "../../Render";
import { ShapeRawData } from "../../types/Raw";

/**
 * History management class for undo/redo operations.
 * Keeps track of canvas state changes and allows reverting to previous states.
 *
 * @example
 * ```ts
 * const history = new History(render);
 * history.start();
 * ```
 */
export class History {
    /** Reference to the main render context. */
    private _render: Render;

    /** Array of serialized canvas states (snapshots). */
    private _history: ShapeRawData[][] = [];
    /** Current position in history stack. */
    private _index: number = -1;

    /**
     * Creates a new History instance.
     * @param render - The main Render context to track history for.
     */
    public constructor (render: Render) {
        this._render = render;
        this.start();
    }

    /**
     * Initializes history tracking by setting up event listeners.
     * Listens for save, undo, and redo events from the renderer.
     */
    public start(): void {
        this._render.on("undo", () => {
            this.undo();
        })

        this._render.on("redo", () => {
            this.redo();
        })
    }

    public save(data: ShapeRawData[]): void {
        this._index++;
        
        if (this._index < this._history.length) {
            this._history = this._history.slice(0, this._index);
        }

        this._history[this._index] = JSON.parse(JSON.stringify(data));
    }

    /**
     * Reverts to the previous canvas state.
     * Does nothing if at the beginning of the history stack.
     */
    public undo(): void {
        if (this._index <= 0) return;
        this._index--;
        const historyState = JSON.parse(JSON.stringify(this._history[this._index]));
        this._render.deserialize(historyState);
    }

    /**
     * Advances to the next canvas state if available.
     * Does nothing if at the end of the history stack.
     */
    public redo(): void {
        if (this._index >= this._history.length - 1) return;
        this._index++;
        const historyState = JSON.parse(JSON.stringify(this._history[this._index]));
        this._render.deserialize(historyState);
    }
}