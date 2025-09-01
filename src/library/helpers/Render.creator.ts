import { Circle, type ICircle } from "../instances/_shapes/Circle";
import { Vector } from "../instances/common/Vector";
import { Render } from "../Render";
import { IRect, Rect } from "../instances/_shapes/Rect";

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
    public Rect(props: IRect): Rect {
        const rect = new Rect(props, this._render);
        this._render.emit("create", { shape: rect })
        return rect;
    }

    /**
     * Creates a new circle shape and emits creation event
     * @param props - Configuration properties for the circle
     * @returns A new Circle instance
     */
    public Circle(props: ICircle): Circle {
        const circle = new Circle(props, this._render);
        this._render.emit("create", { shape: circle });
        return circle;
    }

    /**
     * Creates a new 2D vector with the specified coordinates
     * @param x - The x component of the vector
     * @param y - The y component of the vector
     * @returns A new Vector instance
     */
    public Vector(x: number, y: number): Vector {
        return new Vector(x, y);
    }
}