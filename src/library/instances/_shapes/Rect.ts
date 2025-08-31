import { Shape } from "../Shape";
import { Render } from "../../Render";
import type { RectProps } from "../../types/Shape";
import type { RectRawData } from "../../types/Raw";

/**
 * Rectangular shape implementation for the rendering system.
 * Extends `Shape` to provide position, rotation, styling, and
 * collision detection for rectangle primitives.
 *
 * @example
 * ```ts
 * const rect = new Rect({ width: 100, height: 50, color: 'red' }, render);
 * rect.update();
 * ```
 */
export class Rect extends Shape {
    /** Canvas rendering context for drawing operations. */
    private _ctx: CanvasRenderingContext2D;

    /** Width of the rectangle in pixels. */
    public width: number;
    /** Height of the rectangle in pixels. */
    public height: number;
    /** Fill color of the rectangle (CSS color string). */
    public color: string;
    /** Width of the border in pixels. */
    public borderWidth: number;
    /** Color of the border (CSS color string). */
    public borderColor: string;

    /**
     * Creates a new rectangular shape.
     * @param props - Configuration properties for the rectangle.
     * @param props.width - Width of the rectangle in pixels.
     * @param props.height - Height of the rectangle in pixels.
     * @param props.color - Fill color of the rectangle. Defaults to "white".
     * @param props.borderWidth - Border width in pixels. Defaults to 0.
     * @param props.borderColor - Border color. Defaults to "transparent".
     * @param render - The main `Render` context for drawing operations.
     */
    public constructor(props: RectProps, render: Render, id?: string) {
        super(props, render, id);
        this._ctx = render.ctx;
        this.width = props.width;
        this.height = props.height;
        this.color = props.color ?? "white";
        this.borderWidth = props.borderWidth ?? 0;
        this.borderColor = props.borderColor ?? "transparent";
    }

    /**
     * @internal
     * Checks whether this rectangle intersects with a specified rectangular boundary.
     * All coordinates and dimensions are in canvas pixels (top-left origin).
     *
     * @param boundaryX - X coordinate of the boundary's top-left corner (px).
     * @param boundaryY - Y coordinate of the boundary's top-left corner (px).
     * @param boundaryWidth - Width of the boundary area (px).
     * @param boundaryHeight - Height of the boundary area (px).
     * @returns `true` if this rectangle overlaps the boundary area, otherwise `false`.
     */
    public _isShapeInBoundary(boundaryX: number, boundaryY: number, boundaryWidth: number, boundaryHeight: number): boolean {
        return !(this.position.x + this.width < boundaryX || 
            this.position.x > boundaryX + boundaryWidth ||
            this.position.y + this.height < boundaryY || 
            this.position.y > boundaryY + boundaryHeight);
    }

    /**
     * @internal
     * Determines if a point (usually the mouse cursor) is inside the rectangle.
     * This method correctly handles rotated rectangles by transforming the point
     * into the rectangle's local coordinate system.
     * @returns `true` if the point is inside the rectangle's bounds, otherwise `false`.
     */
    public _isClicked() : boolean {
        const mouseVector = this._render.worldPosition();
        
        if (this.rotation === 0) {
            return mouseVector.x >= this.position.x && 
                   mouseVector.x <= this.position.x + this.width &&
                   mouseVector.y >= this.position.y && 
                   mouseVector.y <= this.position.y + this.height;
        }
        
        const dx = mouseVector.x - this.position.x;
        const dy = mouseVector.y - this.position.y;
        
        const cos = Math.cos(-this.rotation);
        const sin = Math.sin(-this.rotation);
        
        const localX = dx * cos - dy * sin;
        const localY = dx * sin + dy * cos;
        
        return localX >= 0 && 
               localX <= this.width &&
               localY >= 0 && 
               localY <= this.height;
    }

    /**
     * Draws the rectangle on the canvas with its current properties.
     * This method applies position, rotation, and styling (fill and border).
     *
     * @example
     * ```ts
     * rect.draw(); // Manually render the rectangle on the canvas
     * ```
     */
    public draw(): void {
        if (!this.visible) return;
        this._ctx.save();
        this._ctx.translate(this.position.x, this.position.y);
        this._ctx.rotate(this.rotation);

        this._ctx.beginPath();

        this._ctx.rect(0, 0, this.width, this.height);
        this._ctx.fillStyle = this.color;
        this._ctx.fill();

        if (this.borderWidth > 0) {
            this._ctx.lineWidth = this.borderWidth;
            this._ctx.strokeStyle = this.borderColor;
            this._ctx.stroke();
        }

        this._ctx.closePath();

        this._ctx.restore();
    }

    /**
     * Updates the rectangle's state and re-renders it on the canvas.
     * Calls the parent `update` method for physics and then draws the rectangle.
     */
    public update(): void {
        this.draw();
    }

    /**
     * Creates a deep copy of this rectangle.
     * @returns A new `Rect` instance with the same properties.
     */
    public clone() : Rect {
        return this._render.creator.Rect({
            ...this,
            position: this.position.clone(),
        });
    }

    /**
     * @internal
     * Returns the raw data of the rectangle.
     * @returns The raw data of the rectangle.
     */
    public _rawData() : RectRawData {
        return {
            id: this.id,
            type: "rect",
            position: this.position,
            rotation: this.rotation,
            zIndex: this.zIndex,
            dragging: this.dragging,
            visible: this.visible,
            width: this.width ?? 0,
            height: this.height ?? 0,
            color: this.color,
            borderWidth: this.borderWidth,
            borderColor: this.borderColor,
        };
    }

    /**
     * @internal
     * Creates a new rectangle instance from raw data.
     * @param data - The raw data of the rectangle.
     * @returns A new `Rect` instance with identical properties.
     */
    public static _fromRawData(data: RectRawData, render: Render) : Rect {
        const rect = new Rect(data, render, data.id);
        rect.position = data.position;
        rect.rotation = data.rotation;
        rect.zIndex = data.zIndex;
        rect.dragging = data.dragging;
        rect.visible = data.visible;
        rect.width = data.width;
        rect.height = data.height;
        rect.color = data.color;
        rect.borderWidth = data.borderWidth;
        rect.borderColor = data.borderColor;

        render.emit("create", { shape: rect });
        
        return rect;
    }
}