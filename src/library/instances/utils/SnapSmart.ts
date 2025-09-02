import { Render } from "../../Render";
import { Rect } from "../_shapes/Rect";
import { Circle } from "../_shapes/Circle";
import { Shape } from "../Shape";
import { Vector } from "../common/Vector";
import { Text } from "../_shapes/Text";

/**
 * Interface representing the snap points for different sides of a shape.
 * Each side contains a value (position coordinate) and the complementary side to align with.
 */
export interface SnapSides {
    left: { value: number; side: "right" };
    right: { value: number; side: "left" };
    top: { value: number; side: "bottom" };
    bottom: { value: number; side: "top" };
    centerX: { value: number; side: "centerX" };
    centerY: { value: number; side: "centerY" };
}

/**
 * Interface representing a vertical guide line for snapping.
 * Contains x position and the y-range (y1 to y2) for rendering.
 */
interface GuideLineX {
    x: number;
    y1: number;
    y2: number;
}

/**
 * Interface representing a horizontal guide line for snapping.
 * Contains y position and the x-range (x1 to x2) for rendering.
 */
interface GuideLineY {
    y: number;
    x1: number;
    x2: number;
}

/**
 * Smart shape alignment system that helps align shapes with each other or with the viewport.
 * Provides visual guides and automatic snapping when shapes are positioned near alignment points.
 *
 * @example
 * ```ts
 * const snap = new SnapSmart(render);
 * snap.bind(myShape);
 * snap.update();
 * snap.drawGuides();
 * ```
 */
export class SnapSmart {
    /** Reference to the main render context. */
    private _render: Render;

    /** Color of the guide lines (CSS color string). */
    public color: string = "#00ff00";
    /** Width of the guide lines in pixels. */
    public lineWidth: number = 2;
    /** Dash pattern for guide lines [dash length, gap length]. */
    public lineDash: number[] = [5, 5];
    
    /** Currently targeted shape for snapping. */
    private _target: Shape | null = null;
    /** Cached sides information of the target shape. */
    private _sides: SnapSides | null = null;
    /** Best horizontal snap candidate. */
    private _bestX: { diff: number, side: "left" | "right" | "centerX" } | null = null;
    /** Best vertical snap candidate. */
    private _bestY: { diff: number, side: "top" | "bottom" | "centerY" } | null = null;

    /** Maximum distance in pixels to consider for snapping. */
    private _snapTolerance: number = 30;
    /** Smoothing factor for the snap animation (0-1). */
    private _snapFactor: number = 0.005; 

    /** List of horizontal snap candidates. */
    private _candidatesX: { diff: number, side: "left" | "right" | "centerX" }[] = [];
    /** List of vertical snap candidates. */
    private _candidatesY: { diff: number, side: "top" | "bottom" | "centerY" }[] = [];

    /** List of vertical guide lines to render. */
    private _guideLinesX: GuideLineX[] = [];
    /** List of horizontal guide lines to render. */
    private _guideLinesY: GuideLineY[] = [];

    /**
     * Creates a new SnapSmart instance.
     * @param render - The main Render context.
     */
    public constructor(render: Render) {
        this._render = render;

        this._render.on("mouseup", () => {
            if (this._target) {
                this._target.position.x += this._bestX?.diff ?? 0;
                this._target.position.y += this._bestY?.diff ?? 0;
            }
            this.clearGuides();
        });
    }

    /**
     * Updates the snapping system.
     * Calculates snap points, applies snapping forces, and updates guide lines.
     * Should be called on each animation frame when active.
     */
    public update(): void {
        if (!this._target) return;
        this._sides = this.getSides(this._target);
        
        this.clearGuides();

        const diff = this._render.toWorldCoordinates(new Vector(0,0)).sub(this._render.toWorldCoordinates(new Vector(this._render.canvas.width, this._render.canvas.height)));
        const childs = this._render.childs.filter((child: Shape) => child !== this._target && child.visible);
        const closestChild = childs.filter((child: Shape) => {
            const distance = this._target!.position.sub(child.position).len();
            return distance < diff.len();
        });

        closestChild.forEach((child: Shape) => {
            if (!this._sides) return;
            const sidesChild = this.getSides(child);
          
            Object.entries(sidesChild).forEach(([side, value]) => {
                const targetSide = this._sides![value.side as keyof SnapSides];
                const diff = value.value - targetSide.value;
                const diffAbs = Math.abs(diff);

                if (diffAbs < this._snapTolerance / 2) {
                    if ((side === "left" && diff > 0) ||
                        (side === "right" && diff < 0) ||
                        (side === "top" && diff > 0) ||
                        (side === "bottom" && diff < 0) ||
                        (side === "centerX") ||
                        (side === "centerY")) {

                        if (["left", "right", "centerX"].includes(side)) {
                            this._candidatesX.push({ diff, side: side as "left" | "right" | "centerX" });
                            this.addGuideLineX(value.value);
                        }

                        if (["top", "bottom", "centerY"].includes(side)) {
                            this._candidatesY.push({ diff, side: side as "top" | "bottom" | "centerY" });
                            this.addGuideLineY(value.value);
                        }
                    }
                }
            });
        });

        const viewportCenter = this._render.toWorldCoordinates(new Vector(this._render.canvas.width / 2, this._render.canvas.height / 2));
        
        const centerXDiff = viewportCenter.x - this._sides!["centerX"].value;
        const centerYDiff = viewportCenter.y - this._sides!["centerY"].value;
        
        if (Math.abs(centerXDiff) < this._snapTolerance) {
            this._candidatesX.push({ diff: centerXDiff, side: "centerX" });
            this.addGuideLineX(viewportCenter.x);
        }
        
        if (Math.abs(centerYDiff) < this._snapTolerance) {
            this._candidatesY.push({ diff: centerYDiff, side: "centerY" });
            this.addGuideLineY(viewportCenter.y);
        }

        if (this._candidatesX.length > 0) {
            const bestX = this._candidatesX.reduce((a, b) => 
                Math.abs(a.diff) < Math.abs(b.diff) ? a : b
            );
            this._bestX = bestX;
            this._target.position.x += bestX.diff * this._snapFactor;
        }

        if (this._candidatesY.length > 0) {
            const bestY = this._candidatesY.reduce((a, b) => 
                Math.abs(a.diff) < Math.abs(b.diff) ? a : b
            );
            this._bestY = bestY;
            this._target.position.y += bestY.diff * this._snapFactor;
        }

        this._candidatesX = [];
        this._candidatesY = [];
    }

    /**
     * Binds a shape to the snapping system.
     * The bound shape becomes the target for alignment with other shapes.
     * 
     * @param instance - The shape to bind for snapping.
     */
    public bind(instance: Shape) {
        this._target = instance;
        this.sides();
    }

    /**
     * Unbinds the current target shape and clears guide lines.
     * Disables the snapping system until a new shape is bound.
     */
    public unbind(): void {
        this._target = null;
        this._sides = null;
        this.clearGuides();
    }

    /**
     * Updates the cached sides information for the target shape.
     * Called automatically when binding a shape or when shapes change.
     */
    public sides(): void {
        if (!this._target) return;
        this._sides = this.getSides(this._target);
    }

    /**
     * Calculates the snap points for a shape's sides.
     * Handles different shape types (Rectangle, Circle, Text) appropriately.
     * 
     * @param instance - The shape to calculate sides for.
     * @returns Object containing coordinates and complementary sides for snapping.
     */
    public getSides(instance: Shape): SnapSides {
        let width = 0;
        let height = 0;
        let left = instance.position.x;
        let top = instance.position.y;

        if (instance instanceof Rect) {
            width = instance.width;
            height = instance.height;
        }

        if (instance instanceof Circle) {
            width = instance.radius * 2;
            height = instance.radius * 2;
            left = instance.position.x - instance.radius;
            top = instance.position.y - instance.radius;
        }

        if (instance instanceof Text) {
            width = instance.width + instance.padding.left + instance.padding.right + instance.borderWidth / 2;
            height = instance.height + instance.padding.top + instance.padding.bottom + instance.borderWidth / 2;
            left = instance.position.x - instance.padding.left - instance.borderWidth / 2;
            top = instance.position.y - instance.ascent - instance.padding.top - instance.borderWidth / 2;
        }

        return {
            left: { value: left, side: "right" },
            right: { value: left + width, side: "left" },
            top: { value: top, side: "bottom" },
            bottom: { value: top + height, side: "top" },
            centerX: { value: left + width / 2, side: "centerX" },
            centerY: { value: top + height / 2, side: "centerY" },
        };
    }

    /**
     * Adds a vertical guide line at the specified x-coordinate.
     * Guide line will span the entire visible height of the canvas.
     * 
     * @param x - The x-coordinate for the vertical guide line.
     * @private
     */
    private addGuideLineX(x: number): void {
        const topLeft = this._render.toWorldCoordinates(new Vector(this._render.currentCamera.offset.x, this._render.currentCamera.offset.y));
        const bottomRight = this._render.toWorldCoordinates(new Vector(this._render.canvas.width + this._render.currentCamera.offset.x, this._render.canvas.height + this._render.currentCamera.offset.y));
        
        const y1 = topLeft.y;
        const y2 = bottomRight.y;
        
        this._guideLinesX.push({ x, y1, y2 });
    }

    /**
     * Adds a horizontal guide line at the specified y-coordinate.
     * Guide line will span the entire visible width of the canvas.
     * 
     * @param y - The y-coordinate for the horizontal guide line.
     * @private
     */
    private addGuideLineY(y: number): void {
        const topLeft = this._render.toWorldCoordinates(new Vector(this._render.currentCamera.offset.x, this._render.currentCamera.offset.y));
        const bottomRight = this._render.toWorldCoordinates(new Vector(this._render.canvas.width + this._render.currentCamera.offset.x, this._render.canvas.height + this._render.currentCamera.offset.y));
        
        const x1 = topLeft.x;
        const x2 = bottomRight.x;
        
        this._guideLinesY.push({ y, x1, x2 });
    }

    /**
     * Clears all guide lines from the snap system.
     * @private
     */
    private clearGuides(): void {
        this._guideLinesX = [];
        this._guideLinesY = [];
    }

    /**
     * Renders all active guide lines on the canvas.
     * Should be called after the main scene is rendered to show guides on top.
     */
    public drawGuides(): void {
        if (!this._target) return;
        
        this._render.ctx.save();
        this._render.ctx.translate(this._render.currentCamera.offset.x, this._render.currentCamera.offset.y);

        this._render.ctx.strokeStyle = this.color;
        this._render.ctx.lineWidth = this.lineWidth / this._render.zoom;
        this._render.ctx.setLineDash(this.lineDash);
        
        this._guideLinesX.forEach(guide => {
            this._render.ctx.beginPath();
            this._render.ctx.moveTo(guide.x, guide.y1);
            this._render.ctx.lineTo(guide.x, guide.y2);
            this._render.ctx.stroke();
        });
        
        this._guideLinesY.forEach(guide => {
            this._render.ctx.beginPath();
            this._render.ctx.moveTo(guide.x1, guide.y);
            this._render.ctx.lineTo(guide.x2, guide.y);
            this._render.ctx.stroke();
        });
        
        this._render.ctx.restore();
    }
}
