import { Shape } from "../Shape";
import { Render } from "../../Render";
import { Vector } from "../common/Vector";
import type { CircleProps } from "../../types/Shape";
import type { CircleRawData } from "../../types/Raw";

/**
 * Circular shape implementation for the rendering system.
 * Extends `Shape` to provide position, styling, and collision detection
 * for circle primitives.
 *
 * @example
 * ```ts
 * const circle = new Circle({ radius: 50, color: 'blue' }, render);
 * circle.update();
 * ```
 */
export class Circle extends Shape {
    /** Canvas rendering context for drawing operations. */
    private _ctx: CanvasRenderingContext2D;

    /** Radius of the circle in pixels. */
    public radius: number;
    /** Fill color of the circle (CSS color string). */
    public color: string;

    /**
     * Creates a new circular shape.
     * @param props - Configuration properties for the circle.
     * @param props.radius - Radius of the circle in pixels. Defaults to 10.
     * @param props.color - Fill color of the circle. Defaults to "#fff".
     * @param render - The main `Render` context for drawing operations.
     */
    public constructor(props: CircleProps, render: Render, id?: string) {
        super(props, render, id);
        this._ctx = render.ctx;
        this.radius = props.radius ?? 10;
        this.color = props.color ?? "#fff";
    }

    /**
     * Draws the circle on the canvas with its current properties.
     * This method applies position and fill color.
     *
     * @example
     * ```ts
     * circle.draw(); // Manually render the circle on the canvas
     * ```
     */
    public draw() : void {
        if (!this.visible) return;
        this._ctx.save();
        this._ctx.translate(this.position.x, this.position.y);
        this._ctx.beginPath();
        this._ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        this._ctx.fillStyle = this.color;
        this._ctx.fill();
        this._ctx.closePath();
        this._ctx.restore();
    }

    /**
     * Updates the circle's state and re-renders it on the canvas.
     * Calls the parent `update` method for physics and then draws the circle.
     */
    public update() : void {
        this.draw();
    }

    /**
     * @internal
     * Checks whether this circle intersects with a specified rectangular boundary.
     * This check is performed using the circle's axis-aligned bounding box for simplicity.
     *
     * @param boundaryX - X coordinate of the boundary's top-left corner (px).
     * @param boundaryY - Y coordinate of the boundary's top-left corner (px).
     * @param boundaryWidth - Width of the boundary area (px).
     * @param boundaryHeight - Height of the boundary area (px).
     * @returns `true` if the circle's bounding box overlaps the boundary, otherwise `false`.
     */
    public _isShapeInBoundary(boundaryX: number, boundaryY: number, boundaryWidth: number, boundaryHeight: number): boolean {
        const shapeX = this.position.x - this.radius;
        const shapeY = this.position.y - this.radius;
        const shapeWidth = this.radius * 2;
        const shapeHeight = this.radius * 2;
        
        return !(shapeX + shapeWidth < boundaryX || 
            shapeX > boundaryX + boundaryWidth ||
            shapeY + shapeHeight < boundaryY || 
            shapeY > boundaryY + boundaryHeight);
    }

    /**
     * @internal
     * Determines if a point (usually the mouse cursor) is inside the circle.
     * It calculates the distance from the point to the circle's center.
     * @returns `true` if the distance is less than or equal to the radius, otherwise `false`.
     */
    public _isClicked() : boolean {
        const mouseVector = this._render.worldPosition();
        const distance = mouseVector.sub(this.position).len();

        return distance <= this.radius;
    }

    /**
     * Creates a deep copy of this circle.
     * @returns A new `Circle` instance with the same properties.
     */
    public clone() : Circle {
        return this._render.creator.Circle({
            ...this,
            position: this.position.clone(),
        });
    }

    /**
     * @internal
     * Returns the raw data of the circle.
     * @returns The raw data of the circle.
     */
    public _rawData() : CircleRawData {
        return {
            id: this.id,
            type: "circle",
            position: this.position,
            rotation: this.rotation,
            zIndex: this.zIndex,
            dragging: this.dragging,
            visible: this.visible,
            radius: this.radius,
            color: this.color,
        };
    }

    /**
     * @internal
     * Creates a new circle instance from raw data.
     * @param data - The raw data of the circle.
     * @returns A new `Circle` instance with identical properties.
     */
    public static _fromRawData(data: CircleRawData, render: Render) : Circle {
        const circle = new Circle(data, render, data.id);
        circle.position = new Vector(data.position.x, data.position.y);
        circle.rotation = data.rotation;
        circle.zIndex = data.zIndex;
        circle.dragging = data.dragging;
        circle.visible = data.visible;
        circle.radius = data.radius;
        circle.color = data.color;

        render.emit("create", { shape: circle });
        
        return circle;
    }
}