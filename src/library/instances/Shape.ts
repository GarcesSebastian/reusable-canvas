import { v4 as uuidv4 } from 'uuid';
import { Vector } from "./common/Vector";
import { Render } from "../Render";
import { ShapeManager } from "../managers/Shape.manager";
import { ShapeProvider } from "../providers/Shape.provider";

export type ShapeRawData = {
    id: string;
    type: ShapeType;
    position: Vector;
    rotation: number;
    zIndex: number;
    dragging: boolean;
    visible: boolean;
}

export interface IShape {
    position: Vector;
    zIndex?: number;
    rotation?: number;
    dragging?: boolean;
    visible?: boolean;
}

export type ShapeType = "circle" | "rect" | "text" | "image";

/**
 * Abstract base class for all shape primitives in the rendering system.
 * It provides common properties like position, rotation, and visibility,
 * as well as core functionalities such as event handling and updates.
 * This class is intended to be extended by concrete shape implementations like Rect or Circle.
 *
 * @abstract
 */
export abstract class Shape extends ShapeProvider {
    /** The rendering engine instance for drawing operations. */
    protected _render: Render;
    /** Unique identifier for the shape instance (UUID v4). */
    private _id: string;
    /** The type of the shape. */    
    private _type: ShapeType;

    /** Position vector of the shape's origin (top-left corner) in pixels. */
    public position: Vector;
    /** The stacking order of the shape. Higher values are drawn on top. */
    public zIndex: number;
    /** Rotation of the shape in radians, relative to its origin. */
    public rotation: number;
    /** Indicates if the shape is currently being dragged by the user. */
    public dragging: boolean;
    /** If false, the shape will not be rendered. */
    public visible: boolean;
    /** If true, the shape will be automatically saved to the render instance. */
    public _autoSave: boolean = true;
    /** If true, the shape will be selected. */
    public isSelected: boolean = false;
    
    /** Manages shape-specific functionalities and properties. */
    public manager: ShapeManager;
    /** 
     * @internal
     * The transformer instance attached to this shape, if any. 
     * Manages resize and rotation handles. Null if not selected.
     */
    public _transformer: Transformer | null = null;

    /**
     * Creates a new Shape instance.
     * @param props - Configuration properties for the shape.
     * @param props.position - Initial position of the shape. Defaults to (0, 0).
     * @param props.zIndex - Stacking order. Defaults to 0.
     * @param props.rotation - Initial rotation in radians. Defaults to 0.
     * @param props.dragging - Initial dragging state. Defaults to false.
     * @param props.visible - Initial visibility. Defaults to true.
     * @param render - The main `Render` context for drawing operations.
     */
    public constructor(props: IShape, render: Render, type: ShapeType, id?: string) {
        super();
        this.position = props.position ?? new Vector(0, 0);
        this.zIndex = props.zIndex ?? 0;
        this.rotation = props.rotation ?? 0;
        this._id = id ?? uuidv4();
        this.manager = new ShapeManager(this);
        this.dragging = props.dragging ?? false;
        this.visible = props.visible ?? true;
        this._type = type;

        this._render = render;
        this._render.manager.addChild(this);

        if (this.zIndex > this._render._maxZIndex) this._render._maxZIndex = this.zIndex;
        if (this.zIndex < this._render._minZIndex) this._render._minZIndex = this.zIndex;
    }

    /**
     * Gets the unique identifier for this shape.
     * @returns The UUID string identifier.
     */
    public get id() : string {
        return this._id;
    }

    /**
     * Gets the type of the shape.
     * @returns The type of the shape.
     */
    public get type() : ShapeType {
        return this._type;
    }

    /**
     * Gets the render instance associated with this shape.
     * @returns The `Render` instance used for drawing operations.
     */
    public get render() : Render {
        return this._render;
    }

    /**
     * Gets a property of the shape.
     * @param key - The property key to get.
     * @returns The value of the property.
     */
    public abstract get<K extends keyof IShape>(key: K): IShape[K]; 

    /**
     * Sets a property of the shape.
     * @param key - The property key to set.
     * @param value - The value to set.
     */
    public abstract set<K extends keyof IShape>(key: K, value: IShape[K]): this;

    /**
     * Checks if the shape has a specific property.
     * @param key - The property key to check.
     * @returns `true` if the shape has the property, otherwise `false`.
     */
    public abstract has(key: keyof IShape): boolean;

    /**
     * Raises the zIndex of the shape by 1.
     * @returns The shape instance.
     */
    public setTop(): Shape {
        this.zIndex += 1;
        return this;
    }

    /**
     * Lowers the zIndex of the shape by 1.
     * @returns The shape instance.
     */
    public setBottom(): Shape {
        this.zIndex -= 1;
        return this;
    }

    /**
     * Raises the zIndex of the shape to the maximum zIndex in the render.
     * @returns The shape instance.
     */
    public setFront(): Shape {
        this._render._maxZIndex += 1;
        this.zIndex = this._render._maxZIndex;
        return this;
    }

    /**
     * Lowers the zIndex of the shape to the minimum zIndex in the render.
     * @returns The shape instance.
     */
    public setBack(): Shape {
        this._render._minZIndex -= 1;
        this.zIndex = this._render._minZIndex;
        return this;
    }

    /**
     * @internal
     * Abstract method to determine if a point (usually the mouse cursor) is inside the shape.
     * Must be implemented by concrete shape classes.
     * @returns `true` if the point is inside the shape, otherwise `false`.
     */
    public abstract _isClicked() : boolean;

    /**
     * @internal
     * Checks whether this shape intersects with a specified rectangular boundary.
     * All coordinates and dimensions are in canvas pixels (top-left origin).
     * Must be implemented by concrete shape classes.
     *
     * @param boundaryX - X coordinate of the boundary's top-left corner (px).
     * @param boundaryY - Y coordinate of the boundary's top-left corner (px).
     * @param boundaryWidth - Width of the boundary area (px).
     * @param boundaryHeight - Height of the boundary area (px).
     * @returns `true` if this shape overlaps the boundary area, otherwise `false`.
     */
    public abstract _isShapeInBoundary(boundaryX: number, boundaryY: number, boundaryWidth: number, boundaryHeight: number): boolean;

    /**
     * Draws the shape on the canvas.
     * This method is intended to be overridden by concrete shape classes.
     * Calling it on the base class will throw an error.
     *
     * @throws {Error} If the method is not implemented in the extending class.
     */
    public draw() : void {
        throw new Error("Method not implemented.");
    }

    /**
     * Updates the shape's state. Typically called once per frame.
     */
    public abstract update() : void;

    /**
     * Creates a deep copy of this shape.
     * Must be implemented by concrete shape classes.
     * @returns A new `Shape` instance with identical properties.
     */
    public abstract clone() : Shape;

    /**
     * Returns the raw data of the shape.
     * @returns The raw data of the shape.
     */
    public abstract _rawData() : ShapeRawData;

    /**
     * Creates a new shape instance from raw data.
     * @param _data - The raw data of the shape.
     * @param _render - The render instance.
     * @returns A new `Shape` instance with identical properties.
     */
    public static _fromRawData(_data: ShapeRawData, _render: Render) : Shape {
        throw new Error("Method not implemented.");
    }

    /**
     * Removes the shape from the rendering engine and performs cleanup.
     * This emits a 'destroy' event, removes the shape from the render manager,
     * and detaches it from any active transformer.
     */
    public destroy() : void {
        this.emit("destroy", {});
        this._render.manager.removeChild(this);

        if (this.render.transformer && this.render.transformer.inTransformer(this)) {
            this.render.transformer.remove(this);
        }

        if (this.render.database) {
            const table = this.render.database.getTable("nodes" as never)
            if (table) {
                table.delete(this.id as never)
            }
        }
    }
}