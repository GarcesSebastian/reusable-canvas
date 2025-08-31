import { RenderCreator } from "./helpers/Render.creator";
import { Vector } from "./instances/common/Vector";
import { Shape } from "./instances/Shape";
import { RenderManager } from "./managers/Render.manager";
import { RenderProvider } from "./providers/Render.provider";
import { RenderConfiguration, type RenderConfigurationProps } from "./helpers/Render.config";

export class Render extends RenderProvider {
    public canvas: HTMLCanvasElement
    public ctx: CanvasRenderingContext2D

    public childrens: Map<string, Shape> = new Map();
    public configuration: RenderConfiguration;

    private _frameId: number | null = null
    private _renderBound: () => void = this._render.bind(this)
    private _resizeBound: () => void = this._resize.bind(this)
    private _onContextmenuBound: (event: MouseEvent) => void = this._onContextmenu.bind(this);

    private _onMouseClickedBound: (event: MouseEvent) => void = this._onMouseClicked.bind(this);
    private _onMouseDownBound: (event: MouseEvent) => void = this._onMouseDown.bind(this);
    private _onMouseMovedBound: (event: MouseEvent) => void = this._onMouseMoved.bind(this);
    private _onMouseUpBound: (event: MouseEvent) => void = this._onMouseUp.bind(this);
    private _onMouseWheelBound: (event: WheelEvent) => void = this._onMouseWheel.bind(this);
    private _onKeyDownBound: (event: KeyboardEvent) => void = this._onKeyDown.bind(this);
    private _onKeyUpBound: (event: KeyboardEvent) => void = this._onKeyUp.bind(this);

    private _draggingShape: Shape | null = null

    private _mousePosition: Vector = new Vector(0, 0)
    private _lastMousePos: Vector = new Vector(0, 0)

    private _isZooming: boolean = false
    private _isPan: boolean = false
    private _isDragging: boolean = false

    private _zoom: number = 1

    private _lastFrameTime: number = performance.now()
    private _frameCount: number = 0
    private _fps: number = 0

    public _globalPosition: Vector = new Vector(0, 0)
    public _maxZIndex: number = 0
    public _minZIndex: number = 0

    public creator: RenderCreator;
    public manager: RenderManager;

    public constructor(canvas: HTMLCanvasElement) {
        super();
        this.canvas = canvas
        this.ctx = canvas.getContext('2d') as CanvasRenderingContext2D

        this.creator = new RenderCreator(this)
        this.manager = new RenderManager(this)
        this.configuration = new RenderConfiguration(this)

        this.setup()
        this.start()
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

        window.addEventListener("contextmenu", this._onContextmenuBound)

        window.addEventListener("keydown", this._onKeyDownBound)
        window.addEventListener("keyup", this._onKeyUpBound)
        window.addEventListener("wheel", this._onMouseWheelBound, { passive: false })
        window.addEventListener("mousedown", this._onMouseDownBound)
        window.addEventListener("mousemove", this._onMouseMovedBound)
        window.addEventListener("mouseup", this._onMouseUpBound)
        window.addEventListener("click", this._onMouseClickedBound)
    }

    private _onKeyDown(event: KeyboardEvent): void {
        if (event.key === "Control") {
            this._isZooming = true;
        }
    }

    private _onKeyUp(event: KeyboardEvent): void {
        if (event.key === "Control") {
            this._isZooming = false;
        }
    }

    private _onMouseWheel(event: WheelEvent): void {
        event.preventDefault();
        if (!this.pointerInWorld(this.mousePosition())) {
            event.stopPropagation();
            return;
        }

        if (this._isZooming && this.configuration.config.zoom) {
            const zoomFactor = 1.1;
            const mouse = this.mousePosition();
            const worldBefore = this.toWorldCoordinates(mouse);
        
            if (event.deltaY < 0) {
                this._zoom *= zoomFactor;
            } else {
                this._zoom /= zoomFactor;
            }
        
            const worldAfter = this.toWorldCoordinates(mouse);
        
            this._globalPosition.x += (worldAfter.x - worldBefore.x) * this._zoom;
            this._globalPosition.y += (worldAfter.y - worldBefore.y) * this._zoom;
        }

        const isTouchpad = Math.abs(event.deltaX) > 0 || 
                          (Math.abs(event.deltaY) < 50 && Math.abs(event.deltaY) > 0);
        
        if (isTouchpad && this.configuration.config.pan) {
            this._getChildrens().forEach((child: Shape) => {
                child.position.x -= event.deltaX;
                child.position.y -= event.deltaY;
            });
        }
    }

    private _onMouseDown(event: MouseEvent): void {
        this.emit("mousedown", this._getArgs(event, this))

        this._draggingShape = this._getChildrens().find((child: Shape) => child._isClicked()) ?? null;

        if (this._draggingShape) {
            this._isDragging = true;
            this._lastMousePos = this.worldPosition();
            return;
        }

        if (event.button == 1 && this.configuration.config.pan) {
            this._isPan = true;
            this._lastMousePos = this.worldPosition();
        }
    }

    private _onMouseMoved(event: MouseEvent): void {
        this._mousePosition.x = event.clientX
        this._mousePosition.y = event.clientY

        if (this._isDragging && this._draggingShape) {
            const current = this.worldPosition();
            const delta = current.sub(this._lastMousePos);
            this._draggingShape.position.x += delta.x;
            this._draggingShape.position.y += delta.y;
            this._lastMousePos = current;
        }

        if (this._isPan && this.configuration.config.pan) {
            const current = this.worldPosition();
            const delta = current.sub(this._lastMousePos);
            this._getChildrens().forEach((child: Shape) => {
                child.position.x += delta.x;
                child.position.y += delta.y;
            });
            this._lastMousePos = current;
        }

        this.emit("mousemove", this._getArgs(event, this))
    }

    private _onMouseUp(event: MouseEvent): void {
        this.emit("mouseup", this._getArgs(event, this))

        this._isDragging = false;
        this._isPan = false;
        this._draggingShape = null;
        this._lastMousePos = Vector.zero;
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

    private _onContextmenu(event: MouseEvent): void {
        event.preventDefault();
    }

    private _getChildrens(): Shape[] {
        return Array.from([...this.childrens.values()]).sort((a, b) => b.zIndex - a.zIndex)
    }

    private _getArgs<T>(event: MouseEvent, child: Shape | Render): T {
        return {
            pointer: {
                absolute: this.mousePosition(),
                world: this.worldPosition(),
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
        this.ctx.fillText(`FPS: ${this._fps.toFixed(2)}`, this.canvas.width - textWidth * 1.5 - 10, textHeight + 10);
    }

    private _clear(): void {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    }

    private _render(): void {
        this._clear()

        this.ctx.save()
        this.ctx.translate(this._globalPosition.x, this._globalPosition.y)
        this.ctx.scale(this._zoom, this._zoom)

        this._getChildrens().reverse().forEach((child: Shape) => {
            child.update()
        })

        this.ctx.restore()

        this.ctx.save()
        this._updateFps()
        this._showFps()
        this.ctx.restore()

        this._frameId = requestAnimationFrame(this._renderBound)
    }

    public get zoom(): number {
        return this._zoom;
    }

    public mousePosition(): Vector {
        return this._mousePosition;
    }

    public relativePosition(): Vector {
        const { left, top } = this.canvas.getBoundingClientRect()
        return this.mousePosition().sub(new Vector(left, top));
    }

    public worldPosition(): Vector {
        return this.toWorldCoordinates(this.mousePosition());
    }

    public toWorldCoordinates(vector: Vector): Vector {
        const rect = this.canvas.getBoundingClientRect()
        const x = vector.x - rect.left
        const y = vector.y - rect.top
        return new Vector((x - this._globalPosition.x) / this._zoom, (y - this._globalPosition.y) / this._zoom)
    }

    public pointerInWorld(pointer: Vector): boolean {
        const { left, top } = this.canvas.getBoundingClientRect()
        const x = pointer.x - left
        const y = pointer.y - top
        return x >= 0 && x <= this.canvas.width && y >= 0 && y <= this.canvas.height
    }

    public loadConfiguration(config: RenderConfigurationProps): void {
        this.configuration.load(config)
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

        window.removeEventListener("click", this._onMouseClickedBound)
        window.removeEventListener("mousedown", this._onMouseDownBound)
        window.removeEventListener("mousemove", this._onMouseMovedBound)
        window.removeEventListener("mouseup", this._onMouseUpBound)
        window.removeEventListener("keydown", this._onKeyDownBound)
        window.removeEventListener("keyup", this._onKeyUpBound)
    }
}