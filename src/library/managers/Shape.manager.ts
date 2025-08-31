import { Shape } from "../instances/Shape";

/**
 * Manager class for handling shape-specific operations and physics
 */
export class ShapeManager {
    private _shape: Shape;

    /**
     * Creates a new shape manager for the given shape
     * @param shape - The shape instance to manage
     */
    public constructor(shape: Shape) {
        this._shape = shape;
    }
}