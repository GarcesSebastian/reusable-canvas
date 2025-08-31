import { Render } from "../Render";
import { Shape } from "../instances/Shape";

/**
 * Manager class for handling render operations and child shape management
 * Manages the collection of shapes and transformers within a render context
 */
export class RenderManager {
    private _render: Render;

    /**
     * Creates a new render manager for the given render context
     * @param render - The render instance to manage
     */
    public constructor(render: Render) {
        this._render = render;
    }

    /**
     * Adds a shape to the render context's children collection
     * @param child - The shape to add to the render
     */
    public addChild(child: Shape) : void {
        this._render.childrens.set(child.id, child);
    }

    /**
     * Removes a shape from the render context's children collection
     * @param child - The shape to remove from the render
     */
    public removeChild(child: Shape) : void {
        this._render.childrens.delete(child.id);
    }
}