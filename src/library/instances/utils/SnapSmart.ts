import { Render } from "../../Render";
import { Rect } from "../_shapes/Rect";
import { Circle } from "../_shapes/Circle";
import { Shape } from "../Shape";

export interface SnapSides {
    left: { value: number; side: "right" };
    right: { value: number; side: "left" };
    top: { value: number; side: "bottom" };
    bottom: { value: number; side: "top" };
    centerX: { value: number; side: "centerX" };
    centerY: { value: number; side: "centerY" };
}

interface GuideLineX {
    x: number;
    y1: number;
    y2: number;
}

interface GuideLineY {
    y: number;
    x1: number;
    x2: number;
}

export class SnapSmart {
    private _render: Render;

    public color: string = "#00ff00";
    public lineWidth: number = 1;
    public lineDash: number[] = [5, 5];
    
    private _target: Shape | null = null;
    private _sides: SnapSides | null = null;
    private _bestX: { diff: number, side: "left" | "right" | "centerX" } | null = null;
    private _bestY: { diff: number, side: "top" | "bottom" | "centerY" } | null = null;

    private _snapTolerance: number = 30; // Snap tolerance in pixels
    private _snapFactor: number = 0.01; // Snap factor
    private _umbralTolerance: number = 300; // Umbral tolerance in pixels

    private _candidatesX: { diff: number, side: "left" | "right" | "centerX" }[] = [];
    private _candidatesY: { diff: number, side: "top" | "bottom" | "centerY" }[] = [];

    private _guideLinesX: GuideLineX[] = [];
    private _guideLinesY: GuideLineY[] = [];

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

    public update(): void {
        if (!this._target) return;
        this._sides = this.getSides(this._target);
        
        this.clearGuides();
        
        const childs = this._render.childs.filter((child: Shape) => child !== this._target && child.visible);
        const closestChild = childs.filter((child: Shape) => {
            const distance = this._target!.position.sub(child.position).len();
            return distance < this._umbralTolerance;
        });

        closestChild.forEach((child: Shape) => {
            if (!this._sides) return;
            const sidesChild = this.getSides(child);
          
            Object.entries(sidesChild).forEach(([side, value]) => {
                const targetSide = this._sides![value.side as keyof SnapSides];
                const diff = value.value - targetSide.value;
                const diffAbs = Math.abs(diff);

                if (diffAbs < this._snapTolerance) {
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

    public bind(instance: Shape) {
        this._target = instance;
        this.sides();
    }

    public unbind(): void {
        this._target = null;
        this._sides = null;
        this.clearGuides();
    }

    public sides(): void {
        if (!this._target) return;
        this._sides = this.getSides(this._target);
    }

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

        return {
            left: { value: left, side: "right" },
            right: { value: left + width, side: "left" },
            top: { value: top, side: "bottom" },
            bottom: { value: top + height, side: "top" },
            centerX: { value: left + width / 2, side: "centerX" },
            centerY: { value: top + height / 2, side: "centerY" },
        };
    }

    private addGuideLineX(x: number): void {
        const topLeft = this._render.toWorldCoordinates({ x: 0, y: 0 } as any);
        const bottomRight = this._render.toWorldCoordinates({ x: this._render.canvas.width, y: this._render.canvas.height } as any);
        
        const y1 = topLeft.y;
        const y2 = bottomRight.y;
        
        this._guideLinesX.push({ x, y1, y2 });
    }

    private addGuideLineY(y: number): void {
        const topLeft = this._render.toWorldCoordinates({ x: 0, y: 0 } as any);
        const bottomRight = this._render.toWorldCoordinates({ x: this._render.canvas.width, y: this._render.canvas.height } as any);
        
        const x1 = topLeft.x;
        const x2 = bottomRight.x;
        
        this._guideLinesY.push({ y, x1, x2 });
    }

    private clearGuides(): void {
        this._guideLinesX = [];
        this._guideLinesY = [];
    }

    public drawGuides(): void {
        if (!this._target) return;
        
        this._render.ctx.save();
        this._render.ctx.strokeStyle = this.color;
        this._render.ctx.lineWidth = this.lineWidth;
        this._render.ctx.setLineDash(this.lineDash);
        
        this._guideLinesX.forEach(guide => {
            this._render.ctx.beginPath();
            this._render.ctx.moveTo(guide.x - this._render.currentCamera.offset.x, guide.y1 - this._render.currentCamera.offset.y);
            this._render.ctx.lineTo(guide.x - this._render.currentCamera.offset.x, guide.y2 - this._render.currentCamera.offset.y);
            this._render.ctx.stroke();
        });
        
        this._guideLinesY.forEach(guide => {
            this._render.ctx.beginPath();
            this._render.ctx.moveTo(guide.x1 - this._render.currentCamera.offset.x, guide.y - this._render.currentCamera.offset.y);
            this._render.ctx.lineTo(guide.x2 - this._render.currentCamera.offset.x, guide.y - this._render.currentCamera.offset.y);
            this._render.ctx.stroke();
        });
        
        this._render.ctx.restore();
    }
}
