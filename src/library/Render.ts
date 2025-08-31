import { RenderCreator } from "./helpers/Render.creator";
import { Vector } from "./instances/common/Vector";
import { Shape } from "./instances/Shape";
import { RenderManager } from "./managers/Render.manager";
import { RenderProvider } from "./providers/Render.provider";

export class Render extends RenderProvider {
    public canvas: HTMLCanvasElement
    public ctx: CanvasRenderingContext2D

    public childrens: Map<string, Shape> = new Map();

    private _frameId: number | null = null
    private _renderBound: () => void = this._render.bind(this)
    private _resizeBound: () => void = this._resize.bind(this)

    private _onMouseClickedBound: (event: MouseEvent) => void = this._onMouseClicked.bind(this);
    private _onMouseDownBound: (event: MouseEvent) => void = this._onMouseDown.bind(this);
    private _onMouseMovedBound: (event: MouseEvent) => void = this._onMouseMoved.bind(this);
    private _onMouseUpBound: (event: MouseEvent) => void = this._onMouseUp.bind(this);

    private _mousePosition: Vector = new Vector(0, 0)

    private _isDragging: boolean = false
    private _draggingShape: Shape | null = null
    private _draggingOffset: Vector = new Vector(0, 0)

    private _lastFrameTime: number = performance.now()
    private _frameCount: number = 0
    private _fps: number = 0

    public creator: RenderCreator;
    public manager: RenderManager;

    public constructor(canvas: HTMLCanvasElement) {
        super();
        this.canvas = canvas
        this.ctx = canvas.getContext('2d') as CanvasRenderingContext2D

        this.creator = new RenderCreator(this)
        this.manager = new RenderManager(this)

        this.setup()
    }

    private setup(): void {
        this.config()
        this.events()
    }

    private config(): void {
        this._resize()
    }

    private events(): void {
        window.addEventListener('resize', this._resizeBound)
        window.addEventListener("change", this._resizeBound)
        window.addEventListener("orientationchange", this._resizeBound)
        window.addEventListener("visibilitychange", this._resizeBound)

        window.addEventListener("click", this._onMouseClickedBound)
        window.addEventListener("mousedown", this._onMouseDownBound)
        window.addEventListener("mousemove", this._onMouseMovedBound)
        window.addEventListener("mouseup", this._onMouseUpBound)
    }

    private _onMouseMoved(event: MouseEvent): void {
        this._mousePosition.x = event.clientX
        this._mousePosition.y = event.clientY
        const mouseVector = this.mousePositionRelative()

        if (this._isDragging && this._draggingShape) {
            this._draggingShape.position.x = mouseVector.x - this._draggingOffset.x
            this._draggingShape.position.y = mouseVector.y - this._draggingOffset.y
            this._draggingShape.emit("drag", this._getArgs(event, this._draggingShape))
        }

        // this.emit("mousemove", this._getArgs(event, this))
    }

    private _onMouseDown(event: MouseEvent): void {
        const mouseVector = this.mousePositionRelative()
        this._isDragging = true
        this._draggingShape = null

        this._getChildrens().forEach((child: Shape) => {
            if (!child.visible || !child.dragging || !child._isClicked() || this._draggingShape) return

            this._draggingShape = child
            this._draggingOffset = mouseVector.sub(child.position)
            this._draggingShape.emit("dragstart", this._getArgs(event, child))
            return;
        })

        this.emit("mousedown", this._getArgs(event, this))
    }

    private _onMouseUp(event: MouseEvent): void {
        if (!this._draggingShape) return
        this._draggingShape.emit("dragend", this._getArgs(event, this._draggingShape))
        this._isDragging = false
        this._draggingShape = null
        this._draggingOffset = Vector.zero;

        this.emit("mouseup", this._getArgs(event, this))
    }

    private _onMouseClicked(event: MouseEvent): void {
        let clicked = false

        this._getChildrens().forEach((child: Shape) => {
            if (!child.visible || !child._isClicked() || clicked) return

            child.emit("click", this._getArgs(event, child))
            clicked = true;
            return;
        })

        if (clicked) return

        this.emit("click", this._getArgs(event, this))
    }

    private _getChildrens(): Shape[] {
        return Array.from([...this.childrens.values()]).sort((a, b) => b.zIndex - a.zIndex)
    }

    private _getArgs<T>(event: MouseEvent, child: Shape | Render): T {
        return {
            pointer: {
                relative: this.mousePositionRelative(),
                absolute: new Vector(event.clientX, event.clientY),
            },
            target: child,
        } as T
    }

    private _resize(): void {
        const { width, height } = this.canvas.getBoundingClientRect()
        this.canvas.width = width
        this.canvas.height = height
    }

    private _updateFps() : void {
        const now = performance.now();
        const deltaTime = (now - this._lastFrameTime) / 1000;
        this._frameCount++;

        if (deltaTime >= 1) {
            this._fps = this._frameCount / deltaTime;
            this._frameCount = 0;   
            this._lastFrameTime = now;
        }
    }

    private _showFps() : void {
        const measureText = this.ctx.measureText(`FPS: ${this._fps.toFixed(2)}`);
        const textWidth = measureText.width;
        const textHeight = measureText.fontBoundingBoxAscent + measureText.fontBoundingBoxDescent;
        
        this.ctx.fillStyle = "white";
        this.ctx.font = "16px Arial";
        this.ctx.fillText(`FPS: ${this._fps.toFixed(2)}`, this.canvas.width - textWidth - 10, textHeight + 10);
    }

    private _clear(): void {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    }

    private _render(): void {
        this._clear()

        this._getChildrens().reverse().forEach((child: Shape) => {
            child.update()
        })

        this._updateFps()
        this._showFps()

        this._frameId = requestAnimationFrame(this._renderBound)
    }

    public mousePosition(): Vector {
        return this._mousePosition;
    }

    public mousePositionRelative(): Vector {
        const rect = this.canvas.getBoundingClientRect()
        const x = this.mousePosition().x - rect.left
        const y = this.mousePosition().y - rect.top
        return new Vector(x, y)
    }

    public start(): void {
        if (this._frameId) return
        this._frameId = requestAnimationFrame(this._renderBound)
    }

    public stop(): void {
        if (!this._frameId) return
        cancelAnimationFrame(this._frameId)
        this._frameId = null
    }

    public destroy() : void {
        this.stop();
        window.removeEventListener("resize", this._resizeBound);
        window.removeEventListener("change", this._resizeBound);
        window.removeEventListener("orientationchange", this._resizeBound);
        window.removeEventListener("visibilitychange", this._resizeBound);
    }
}