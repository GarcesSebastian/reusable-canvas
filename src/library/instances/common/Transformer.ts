import { Render } from "../../Render";
import { Shape } from "../Shape";
import { Rect } from "../_shapes/Rect";
import { Circle } from "../_shapes/Circle";
import { Text } from "../_shapes/Text";
import { Image } from "../_shapes/Image";
import { Vector } from "../common/Vector";
import { TransformerProvider } from "../../providers/Transformer.provider";

/** Padding configuration for transformer boundaries. */
export type Padding = { top: number; right: number; bottom: number; left: number };
/** Node box configuration containing position and size vectors. */
export type NodeBox = { position: Vector; size: Vector };

/** Interface defining transformer configuration options. */
export interface ITransformer {
    borderWidth?: number;
    borderColor?: string;
    nodeColor?: string;
    nodeBorderWidth?: number;
    nodeBorderColor?: string;
    nodeSize?: number;
    padding?: Padding;
}

/**
 * Multi-selection transformer for manipulating multiple shapes simultaneously.
 * Provides visual handles for resizing, moving, and transforming groups of shapes.
 * Handles both individual shape transformations and group operations with proper scaling.
 *
 * @example
 * ```ts
 * const transformer = new Transformer(render);
 * transformer.add(shape1);
 * transformer.add(shape2);
 * // Now both shapes can be transformed together
 * ```
 */
export class Transformer extends TransformerProvider {
    /** The rendering engine instance for drawing operations. */
    public _render: Render;

    /** Map of selected shapes indexed by their ID. */
    public _childs: Map<string, Shape> = new Map();
    /** Padding around the transformer boundary for visual spacing. */
    public padding: Padding = { top: 0, right: 0, bottom: 0, left: 0 };
    /** Configuration for the transformer's appearance. */
    public borderWidth: number;
    /** Configuration for the transformer's appearance. */
    public borderColor: string;
    /** Configuration for the transformer's appearance. */
    public nodeColor: string;
    /** Configuration for the transformer's appearance. */
    public nodeBorderWidth: number;
    /** Configuration for the transformer's appearance. */
    public nodeBorderColor: string;
    /** Configuration for the transformer's appearance. */
    public nodeSize: number;

    /** Current position of the transformer's top-left corner. */
    private _position: Vector = new Vector(0, 0);
    /** Current width of the transformer boundary. */
    private _width: number = 0;
    /** Current height of the transformer boundary. */
    private _height: number = 0;

    /** Template positions for transformation nodes (0-1 normalized coordinates). */
    private _nodesBoxTemplate: Map<string, Vector> = new Map();
    /** Actual screen positions and sizes of transformation nodes. */
    private _nodesBox: Map<string, NodeBox> = new Map();

    /** Indicates if currently resizing via transformation nodes. */
    private _isDragging: boolean = false;
    /** Indicates if currently moving the entire selection. */
    private _isMovingSelection: boolean = false;
    /** The currently active transformation node being dragged. */
    private _activeNode: string | null = null;
    /** Last recorded mouse position for delta calculations. */
    private _lastMousePos: Vector = new Vector(0, 0);
    /** Original shape data before transformation for proper scaling calculations. */
    private _originalData: Map<string, { position: Vector; width?: number; height?: number; radius?: number; fontSize?: number }> = new Map();
    /** Original transformer bounds before transformation. */
    private _originalBounds: { width: number; height: number; position: Vector } = { width: 0, height: 0, position: new Vector(0, 0) };
    
    /**
     * Creates a new Transformer instance.
     * @param render - The main Render context for drawing operations.
     * @param DataTransformer - Optional configuration for transformer properties.
     */
    public constructor(render: Render, DataTransformer?: ITransformer) {
        super();
        this._render = render;
        this.padding = DataTransformer?.padding ?? { top: 0, right: 0, bottom: 0, left: 0 };
        this.borderWidth = DataTransformer?.borderWidth ?? 2;
        this.borderColor = DataTransformer?.borderColor ?? "#00ff00";
        this.nodeColor = DataTransformer?.nodeColor ?? "#00ff00";
        this.nodeBorderWidth = DataTransformer?.nodeBorderWidth ?? 2;
        this.nodeBorderColor = DataTransformer?.nodeBorderColor ?? "#00ff00";
        this.nodeSize = DataTransformer?.nodeSize ?? 10;

        this._setup();
    }

    /**
     * Initializes the transformer by setting up configuration and events.
     * @private
     */
    private _setup(): void {
        this._config();
        this._events();
    }

    /**
     * Configures the transformation node positions using normalized coordinates (0-1).
     * Sets up 8 resize handles around the transformer boundary.
     * @private
     */
    private _config(): void {
        this._nodesBoxTemplate.set("top-left", new Vector(0, 0));
        this._nodesBoxTemplate.set("top-center", new Vector(0.5, 0));
        this._nodesBoxTemplate.set("top-right", new Vector(1, 0));
        this._nodesBoxTemplate.set("middle-left", new Vector(0, 0.5));
        this._nodesBoxTemplate.set("middle-right", new Vector(1, 0.5));
        this._nodesBoxTemplate.set("bottom-left", new Vector(0, 1));
        this._nodesBoxTemplate.set("bottom-center", new Vector(0.5, 1));
        this._nodesBoxTemplate.set("bottom-right", new Vector(1, 1));
    }
    
    /**
     * Sets up event listeners for mouse interactions.
     * Handles mousedown, mousemove, mouseup, and click events.
     * @private
     */
    private _events(): void {
        this._render.on("mousedown", this._onMouseDown.bind(this));
        this._render.on("click", this._onCanvasClick.bind(this));
        window.addEventListener("mousemove", this._onMouseMove.bind(this));
        window.addEventListener("mouseup", this._onMouseUp.bind(this));
    }

    /**
     * Handles mouse down events for starting transformations.
     * Determines if user clicked on a resize node or the transformer area.
     * @private
     */
    private _onMouseDown(): void {
        if (this._childs.size === 0 || !this._render.configuration.config.transform) return;

        const activeNode = this._isClickedAnyNode();
        if (activeNode) {
            this._isDragging = true;
            this._isMovingSelection = false;
            this._activeNode = activeNode;
            this._lastMousePos = this._render.worldPosition();
            
            this._originalData.clear();
            this._childs.forEach(child => {
                const data: any = { position: child.position.copy() };
                if (child instanceof Rect) {
                    data.width = child.width;
                    data.height = child.height;
                } else if (child instanceof Circle) {
                    data.radius = child.radius;
                } else if (child instanceof Text) {
                    data.width = child.width;
                    data.height = child.height;
                    data.fontSize = child.fontSize;
                } else if (child instanceof Image) {
                    data.width = child.width;
                    data.height = child.height;
                }
                this._originalData.set(child.id, data);
            });
            
            this._originalBounds = {
                width: this._width,
                height: this._height,
                position: this._position.copy()
            };

            this.emit("resizestart", {})
            return;
        }

        if (this._isClicked()) {
            this._isMovingSelection = true;
            this._isDragging = false;
            this._activeNode = null;
            this._lastMousePos = this._render.worldPosition();
            this.emit("movestart", {})
        }
    }

    /**
     * Handles mouse move events during transformations.
     * Manages both selection movement and resize operations with proper scaling.
     * @private
     */
    private _onMouseMove(): void {
        if (!this._render.configuration.config.transform) return;
        const currentMousePos = this._render.worldPosition();
        
        if (this._isMovingSelection && !this._isDragging) {
            const delta = currentMousePos.sub(this._lastMousePos);
            this._childs.forEach(child => {
                child.position = child.position.add(delta);
            });
            this.emit("move", {})
            this._lastMousePos = currentMousePos;
            return;
        }

        if (this._isDragging && this._activeNode && !this._isMovingSelection) {
            const anchor = this._nodesBoxTemplate.get(this._activeNode)!;
            const anchorOpposite = new Vector(1 - anchor.x, 1 - anchor.y);

            const originalWidth = this._originalBounds.width;
            const originalHeight = this._originalBounds.height;
            const minSize = 10;

            const totalDelta = currentMousePos.sub(this._lastMousePos);

            let newWidth = originalWidth;
            let newHeight = originalHeight;
            if (this._activeNode.includes("right")) {
                newWidth = originalWidth + totalDelta.x;
            } else if (this._activeNode.includes("left")) {
                newWidth = originalWidth - totalDelta.x;
            }

            if (this._activeNode.includes("bottom")) {
                newHeight = originalHeight + totalDelta.y;
            } else if (this._activeNode.includes("top")) {
                newHeight = originalHeight - totalDelta.y;
            }

            newWidth = Math.max(newWidth, minSize);
            newHeight = Math.max(newHeight, minSize);

            const scaleX = newWidth / originalWidth;
            const scaleY = newHeight / originalHeight;

            const originalAnchorPoint = new Vector(
                this._originalBounds.position.x + anchorOpposite.x * this._originalBounds.width,
                this._originalBounds.position.y + anchorOpposite.y * this._originalBounds.height
            );

            this._childs.forEach(child => {
                const original = this._originalData.get(child.id)!;
                const relativePos = original.position.sub(originalAnchorPoint);

                const newRelativePos = new Vector(relativePos.x * scaleX, relativePos.y * scaleY);
                child.position = originalAnchorPoint.add(newRelativePos);

                if (child instanceof Rect) {
                    child.width = original.width! * scaleX;
                    child.height = original.height! * scaleY;
                } else if (child instanceof Circle) {
                    child.radius = original.radius! * Math.max(scaleX, scaleY);
                } else if (child instanceof Text) {
                    child.fontSize = original.fontSize! * Math.max(scaleX, scaleY);
                } else if (child instanceof Image) {
                    child.width = original.width! * scaleX;
                    child.height = original.height! * scaleY;
                }
            });

            this.emit("resize", {})
        }
    }

    /**
     * Handles mouse up events to finalize transformations.
     * Resets all transformation states and clears temporary data.
     * @private
     */
    private _onMouseUp(): void {
        if (!this._render.configuration.config.transform) return;
        if (this._isDragging || this._isMovingSelection || this._activeNode) {
            this._render.autoSave();
        }
        this._isDragging = false;
        this._isMovingSelection = false;
        this._activeNode = null;
        this._originalData.clear();
        this.emit("moveend", {})
        this.emit("resizeend", {})
    }

    /**
     * Handles canvas click events for selection management.
     * Clears selection if clicking outside transformer or selected shapes.
     * @private
     */
    private _onCanvasClick(): void {
        if (this._childs.size === 0 || !this._render.configuration.config.transform) return;

        const clickedOnTransformer = this._isClicked();
        const clickedOnNode = this._isClickedAnyNode();
        const clickedOnSelectedShape = this._isClickedOnSelectedShape();

        if (!clickedOnTransformer && !clickedOnNode && !clickedOnSelectedShape && !this._render.selection._justFinishedSelecting) {
            this.clear();
        }

        this._render.selection._justFinishedSelecting = false;
    }

    /**
     * Checks if the mouse pointer is over any currently selected shape.
     * @returns True if clicking on a selected shape, false otherwise.
     * @private
     */
    private _isClickedOnSelectedShape(): boolean {
        if (!this._render.configuration.config.transform) return false;
        for (const shape of this._render.childrens.values()) {
            if (shape.isSelected && shape._isClicked()) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * Determines if the mouse pointer is within the transformer boundary.
     * Excludes clicks on transformation nodes.
     * @returns True if clicking within transformer area, false otherwise.
     * @private
     */
    private _isClicked(): boolean {
        if (this._childs.size === 0) return false;

        const pointer = this._render.worldPosition();
        const offset = this._render.getOffset();
        const position = this._position.sub(offset);

        const boxX = position.x - this.padding.left;
        const boxY = position.y - this.padding.top;
        const boxWidth = this._width + this.padding.left + this.padding.right;
        const boxHeight = this._height + this.padding.top + this.padding.bottom;

        const isInBox = (
            pointer.x >= boxX &&
            pointer.x <= boxX + boxWidth &&
            pointer.y >= boxY &&
            pointer.y <= boxY + boxHeight
        );

        const nodeClicked = this._isClickedAnyNode();
        
        return isInBox && !nodeClicked;
    }

    /**
     * Checks if the mouse pointer is over any transformation node.
     * @returns The name of the clicked node, or null if no node was clicked.
     * @private
     */
    private _isClickedAnyNode(): string | null {
        if (this._childs.size === 0) return null;
        const pointer = this._render.worldPosition();
        const offset = this._render.getOffset();

        for (const [key, node] of this._nodesBox.entries()) {
            const nodePosition = node.position.sub(offset);
            const nodeX = nodePosition.x - (node.size.x / this._render.zoom) / 2;
            const nodeY = nodePosition.y - (node.size.y / this._render.zoom) / 2;
            const nodeWidth = node.size.x / this._render.zoom;
            const nodeHeight = node.size.y / this._render.zoom;

            if (
                pointer.x >= nodeX &&
                pointer.x <= nodeX + nodeWidth &&
                pointer.y >= nodeY &&
                pointer.y <= nodeY + nodeHeight
            ) {
                return key;
            }
        }

        return null;
    }

    /**
     * Calculates the bounding box that encompasses all selected shapes.
     * Updates the transformer's position, width, and height based on shape bounds.
     * @private
     */
    private _calculateBox(): void {
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;
        
        if (this._childs.size === 0) return;
        
        this._childs.forEach((child: Shape) => {
            let sizeX = 0;
            let sizeY = 0;
            let currentX = child.position.x;
            let currentY = child.position.y;

            if (child instanceof Rect) {
                sizeX = child.width;
                sizeY = child.height;
            } else if (child instanceof Circle) {
                sizeX = child.radius * 2;
                sizeY = child.radius * 2;
                currentX = child.position.x - child.radius;
                currentY = child.position.y - child.radius;
            } else if (child instanceof Text) {
                sizeX = child.width + child.padding.left + child.padding.right + child.borderWidth;
                sizeY = child.height + child.padding.top + child.padding.bottom + child.borderWidth;
                currentX = child.position.x + child._getTextOffsetX() - child.padding.left - child.borderWidth / 2;
                currentY = child.position.y - child.ascent - child.padding.top - child.borderWidth / 2;
            } else if (child instanceof Image) {
                sizeX = child.width;
                sizeY = child.height;
                currentX = child.position.x;
                currentY = child.position.y;
            }

            minX = Math.min(minX, currentX);
            maxX = Math.max(maxX, currentX + sizeX);
            minY = Math.min(minY, currentY);
            maxY = Math.max(maxY, currentY + sizeY);
        })

        this._position = new Vector(minX, minY);
        this._width = maxX - minX;
        this._height = maxY - minY;
    }

    /**
     * Calculates the screen positions of all transformation nodes.
     * Updates node positions based on current transformer bounds and zoom level.
     * @private
     */
    private _calculateNodesBox(): void {
        this._nodesBox.clear();

        const boxX = this._position.x - this.padding.left;
        const boxY = this._position.y - this.padding.top;
        const boxWidth = this._width + this.padding.left + this.padding.right;
        const boxHeight = this._height + this.padding.top + this.padding.bottom;

        this._nodesBoxTemplate.forEach((node: Vector, key: string) => {
            const posX = boxX + node.x * boxWidth;
            const posY = boxY + node.y * boxHeight;
            this._nodesBox.set(key, { position: new Vector(posX, posY), size: new Vector(this.nodeSize, this.nodeSize) });
        })
    }

    /**
     * Renders the transformer boundary box.
     * Draws a green outline around the selected shapes.
     * @private
     */
    private _updateBox(): void {
        if (this._childs.size === 0) return;

        const posX = this._position.x - this.padding.left;
        const posY = this._position.y - this.padding.top;
        const width = this._width + this.padding.left + this.padding.right;
        const height = this._height + this.padding.top + this.padding.bottom;
        const offset = this._render.getOffset();

        this._render.ctx.save()

        this._render.ctx.beginPath()
        this._render.ctx.rect(posX - offset.x, posY - offset.y, width, height)
        this._render.ctx.strokeStyle = this.borderColor
        this._render.ctx.lineWidth = this.borderWidth / this._render.scale
        this._render.ctx.stroke()
        this._render.ctx.closePath()

        this._render.ctx.restore()
    }

    /**
     * Renders all transformation nodes (resize handles).
     * Draws white squares with red borders at each transformation point.
     * @private
     */
    private _updateNodes(): void {
        if (this._childs.size === 0) return;
        const offset = this._render.getOffset();

        this._nodesBox.forEach((node: NodeBox) => {
            this._render.ctx.save()

            this._render.ctx.beginPath()
            this._render.ctx.rect(
                node.position.x - (node.size.x / this._render.scale) / 2 - offset.x, 
                node.position.y - (node.size.y / this._render.scale) / 2 - offset.y, 
                node.size.x / this._render.scale, 
                node.size.y / this._render.scale
            )
            this._render.ctx.fillStyle = this.nodeColor
            this._render.ctx.strokeStyle = this.nodeBorderColor
            this._render.ctx.lineWidth = this.nodeBorderWidth / this._render.scale
            this._render.ctx.fill()
            this._render.ctx.stroke()
            this._render.ctx.closePath()

            this._render.ctx.restore()
        })
    }

    /**
     * Gets the current position of the transformer's top-left corner.
     * @returns The position as a Vector.
     */
    public get position(): Vector {
        return this._position;
    }

    /**
     * Gets the current width of the transformer boundary.
     * @returns The width in pixels.
     */
    public get width(): number {
        return this._width;
    }

    /**
     * Gets the current height of the transformer boundary.
     * @returns The height in pixels.
     */
    public get height(): number {
        return this._height;
    }

    /**
     * Checks if the transformer is empty (no shapes selected).
     * @returns True if the transformer is empty, false otherwise.
     */
    public isEmpty(): boolean {
        return this._childs.size === 0;
    }

    /**
     * Checks if a shape is currently selected.
     * @param shape - The shape to check.
     * @returns True if the shape is selected, false otherwise.
     */
    public inTransformer(shape: Shape): boolean {
        return this._childs.has(shape.id);
    }

    /**
     * Checks if the mouse pointer is within the transformer boundary.
     * Excludes clicks on transformation nodes.
     * @returns True if clicking within transformer area, false otherwise.
     */
    public isClickedTransformer(): boolean {
        return this._isClicked() || this._isClickedAnyNode() !== null;
    }

    /**
     * Updates and renders the transformer.
     * Recalculates bounds, node positions, and draws the transformer UI.
     * Should be called every frame when shapes are selected.
     */
    public update(): void {
        this._calculateBox();
        this._calculateNodesBox();
        this._updateBox();
        this._updateNodes();
    }

    /**
     * Sets the configuration for the transformer.
     * @param DataTransformer - The configuration object.
     */
    public setConfig (DataTransformer: ITransformer): void {
        this.padding = DataTransformer?.padding ?? this.padding;
        this.borderWidth = DataTransformer?.borderWidth ?? this.borderWidth;
        this.borderColor = DataTransformer?.borderColor ?? this.borderColor;
        this.nodeColor = DataTransformer?.nodeColor ?? this.nodeColor;
        this.nodeSize = DataTransformer?.nodeSize ?? this.nodeSize;
        this.nodeBorderWidth = DataTransformer?.nodeBorderWidth ?? this.nodeBorderWidth;
        this.nodeBorderColor = DataTransformer?.nodeBorderColor ?? this.nodeBorderColor;
    }

    /**
     * Selects all shapes in the transformer selection.
     */
    public selectAll(): void {
        this.clear();
        this._render.childs.forEach(child => this.add(child));
    }

    /**
     * Adds a shape to the transformer selection.
     * @param child - The shape to add to the selection.
     */
    public add(child: Shape): void {
        this._childs.set(child.id, child);
        child.isSelected = true;
    }

    /**
     * Removes a shape from the transformer selection.
     * @param child - The shape to remove from the selection.
     */
    public remove(child: Shape): void {
        this._childs.delete(child.id);
        child.isSelected = false;
    }

    /**
     * Clears all shapes from the transformer selection.
     * Deselects all currently selected shapes.
     */
    public clear(): void {
        this._childs.forEach(child => child.isSelected = false);
        this._childs.clear();
    }

    /**
     * Gets the map of currently selected shapes.
     * @returns Map of shapes indexed by their ID.
     */
    public get childs(): Map<string, Shape> {
        return this._childs;
    }

    /**
     * Indicates if the transformer is currently in resize mode.
     * @returns True if actively resizing via transformation nodes.
     */
    get isDragging(): boolean {
        return this._isDragging;
    }

    /**
     * Indicates if the transformer is currently moving the selection.
     * @returns True if actively moving all selected shapes together.
     */
    get isMovingSelection(): boolean {
        return this._isMovingSelection;
    }
}