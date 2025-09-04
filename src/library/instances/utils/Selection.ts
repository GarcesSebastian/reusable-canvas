import { Render } from "../../Render";
import { Shape } from "../Shape";
import { Vector } from "../common/Vector";

/**
 * Handles the creation and management of a selection box for selecting multiple shapes.
 * It detects which shapes are within the selection boundary and updates the transformer.
 *
 * @example
 * ```ts
 * const selection = new Selection(render);
 * // The selection instance is automatically managed by the Render class.
 * ```
 */
export class Selection {
    /** The rendering engine instance for drawing operations. */
    private _render: Render;

    /** Array of shapes currently within the selection box. */
    public _selected: Shape[] = [];
    /** Indicates if the user is currently dragging to create a selection box. */
    public _isSelecting: boolean = false;
    /** Flag to prevent clearing selection immediately after it's made. */
    public _justFinishedSelecting: boolean = false;
    /** The starting position of the selection drag. */
    public _startPosition: Vector = Vector.zero;
    /** The ending position of the selection drag. */
    public _endPosition: Vector = Vector.zero;
    /** The width of the selection box. */
    public _width: number = 0;
    /** The height of the selection box. */
    public _height: number = 0;
    /** The minimum distance the mouse must travel to initiate a selection box. */
    public _minDistance: number = 5;

    /**
     * Creates a new Selection instance.
     * @param render - The main Render context for drawing operations.
     */
    public constructor(render: Render) {
        this._render = render;
    }

    /**
     * Detects which shapes are within the current selection boundary.
     * Clears the previous selection in the transformer and adds the newly selected shapes.
     */
    public detectSelectedShapes(): void {
        this._selected = [];
        const x = Math.min(this._startPosition.x, this._endPosition.x);
        const y = Math.min(this._startPosition.y, this._endPosition.y);
        const width = Math.abs(this._width);
        const height = Math.abs(this._height);

        for (const shape of this._render.childrens.values()) {
            if (shape._isShapeInBoundary(x, y, width, height)) {
                this._selected.push(shape);
            }
        }

        this._render.transformer.clear();
        this._selected.forEach((child) => this._render.transformer.add(child));
    }

    /**
     * Updates and renders the selection box on the canvas.
     * Draws a semi-transparent rectangle representing the selection area.
     * This is called on every frame while a selection is active.
     */
    public update(): void {
        if (!this._isSelecting) return;

        const distance = Math.sqrt(this._width * this._width + this._height * this._height);
        if (distance < this._minDistance) return;

        const x = Math.min(this._startPosition.x, this._endPosition.x);
        const y = Math.min(this._startPosition.y, this._endPosition.y);
        const width = Math.abs(this._width);
        const height = Math.abs(this._height);

        this._render.ctx.save();

        this._render.ctx.beginPath();
        this._render.ctx.rect(x, y, width, height);
        this._render.ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
        this._render.ctx.fill();
        this._render.ctx.closePath();

        this._render.ctx.restore();
    }
}
