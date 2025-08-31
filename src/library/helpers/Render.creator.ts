import { Circle as _Circle } from "../instances/_shapes/Circle";
import { Vector as _Vector } from "../instances/common/Vector";
import { Render } from "../Render";
import { Rect as _Rect } from "../instances/_shapes/Rect";
import type { CircleProps, RectProps } from "../types/Shape";

/**
 * Factory class for creating shapes and utility objects within a render context
 * Provides convenient methods to instantiate shapes with automatic event emission
 */
export class RenderCreator {
    private _render: Render;

    /**
     * Creates a new render creator for the given render context
     * @param render - The render instance to associate created objects with
     */
    public constructor(render: Render) {
        this._render = render;
    }
    
    /**
     * Creates a new rectangle shape and emits creation event
     * @param props - Configuration properties for the rectangle
     * @returns A new Rect instance
     */
    public Rect(props: RectProps): _Rect {
        const rect = new _Rect(props, this._render);
        this._render.emit("create", { shape: rect })
        return rect;
    }

    /**
     * Creates a new circle shape and emits creation event
     * @param props - Configuration properties for the circle
     * @returns A new Circle instance
     */
    public Circle(props: CircleProps): _Circle {
        const circle = new _Circle(props, this._render);
        this._render.emit("create", { shape: circle });
        return circle;
    }

    /**
     * Creates a new 2D vector with the specified coordinates
     * @param x - The x component of the vector
     * @param y - The y component of the vector
     * @returns A new Vector instance
     */
    public Vector(x: number, y: number): _Vector {
        return new _Vector(x, y);
    }
}