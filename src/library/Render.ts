import { RenderCreator } from "./helpers/Render.creator";
import { Vector } from "./instances/common/Vector";
import { RenderManager } from "./managers/Render.manager";
import { RenderProvider } from "./providers/Render.provider";
import { RenderConfiguration, type RenderConfigurationProps } from "./helpers/Render.config";
import { Camera } from "./instances/common/Camera";
import { History } from "./instances/utils/History";
import { SnapSmart } from "./instances/utils/SnapSmart";
import { Shape, type ShapeRawData } from "./instances/Shape";
import { Rect, type RectRawData } from "./instances/_shapes/Rect";
import { Circle, type CircleRawData } from "./instances/_shapes/Circle";
import { Text, type TextRawData } from "./instances/_shapes/Text";
import { Image, type ImageRawData } from "./instances/_shapes/Image";
import { Selection } from "./instances/utils/Selection";
import { Transformer } from "./instances/common/Transformer";
import { Database } from "./database/Database";
import { ConfigurationSchema, NodeSchema } from "./types/Schemas";
import { Exporter } from "./instances/utils/Exporter";

export interface RenderProperties {
    zoom: number;
    globalPosition: Vector;
    offsetPan: Vector;
}

/**
 * Main rendering system class.
 * Manages the canvas, mouse events, zoom, panning, and drawn shapes.
 *
 * @example
 * ```ts
 * const canvas = document.getElementById('canvas') as HTMLCanvasElement;
 * const render = new Render(canvas);
 * const rect = new Rect(render, { x: 100, y: 100, width: 200, height: 100 });
 * ```
 */
export class Render extends RenderProvider {
    /** HTML canvas element used for rendering. */
    public canvas: HTMLCanvasElement
    /** 2D canvas context for drawing operations. */
    public ctx: CanvasRenderingContext2D

    /** Current camera that controls the canvas view. */
    public currentCamera: Camera;
    /** Map of all shapes on the canvas, indexed by their ID. */
    public childrens: Map<string, Shape> = new Map();
    /** Rendering system configuration. */
    public configuration: RenderConfiguration;
    /** History system for undo/redo operations. */
    public history: History;
    /** Smart snapping system for shapes. */
    public snapSmart: SnapSmart;
    /** Transformer system for shapes. */
    public transformer: Transformer;
    /** Selection system for shapes. */
    public selection: Selection;
    /** Export system for shapes. */
    public exporter: Exporter;

    /** Database instance for data persistence. */
    private _database: Database | null = null;
    /** Last serialized data string for comparison to avoid unnecessary saves. */
    private _lastSerializedData: string = "";
    /** Callback function for saving progress updates. */
    public onSavingProgress: ((progress: { p: number; state: boolean }) => void) | null = null;
    /** Callback function for loading progress updates. */
    public onLoadProgress: ((progress: { p: number; state: boolean }) => void) | null = null;
    /** Debounce timeout for configuration-only saves. */
    private _configSaveTimeout: number | null = null;

    /** Current animation frame ID. */
    private _frameId: number | null = null
    /** Bound rendering function to maintain the correct context. */
    private _renderBound: () => void = this._render.bind(this)
    /** Bound resize function to maintain the correct context. */
    private _resizeBound: () => void = this.resize.bind(this)
    /** Bound context menu function to maintain the correct context. */
    private _onContextmenuBound: (event: MouseEvent) => void = this._onContextmenu.bind(this);

    /** Bound mouse click function. */
    private _onMouseClickedBound: (event: MouseEvent) => void = this._onMouseClicked.bind(this);
    /** Bound mouse down function. */
    private _onMouseDownBound: (event: MouseEvent) => void = this._onMouseDown.bind(this);
    /** Bound mouse move function. */
    private _onMouseMovedBound: (event: MouseEvent) => void = this._onMouseMoved.bind(this);
    /** Bound mouse up function. */
    private _onMouseUpBound: (event: MouseEvent) => void = this._onMouseUp.bind(this);
    /** Bound mouse wheel function. */
    private _onMouseWheelBound: (event: WheelEvent) => void = this._onMouseWheel.bind(this);
    /** Bound key down function. */
    private _onKeyDownBound: (event: KeyboardEvent) => void = this._onKeyDown.bind(this);
    /** Bound key up function. */
    private _onKeyUpBound: (event: KeyboardEvent) => void = this._onKeyUp.bind(this);

    /** Shape currently being dragged. */
    private _draggingShape: Shape | null = null

    /** Current mouse position in absolute coordinates. */
    private _mousePosition: Vector = new Vector(0, 0)
    /** Last recorded mouse position. */
    private _lastMousePos: Vector = new Vector(0, 0)
    /** Offset for panning. */
    private _offsetPan: Vector = new Vector(0, 0)

    /** Indicates if zoom mode is active (Ctrl key pressed). */
    private _isZooming: boolean = false
    /** Indicates if pan mode is active. */
    private _isPan: boolean = false
    /** Indicates if a shape is being dragged. */
    private _isDragging: boolean = false
    /** Indicates if shift key is pressed for multi-selection. */
    private _isShiftPressed: boolean = false
    /** Indicates if dragging occurred during the current mouse interaction. */
    private _wasDragging: boolean = false
    /** Time when mouse down occurred. */
    private _mouseDownTime: number = 0
    /** Minimum time in milliseconds before dragging activates. */
    private _dragThreshold: number = 150

    /** Current zoom factor. */
    private _zoom: number = 1
    /** Timeout for wheel events. */
    private _wheelTimeout: number | null = null;

    /** Last recorded click time to detect double clicks. */
    private _lastTimeClick: number = performance.now();
    /** Last recorded time to calculate FPS. */
    private _lastFrameTime: number = performance.now()
    /** Frame counter for calculating FPS. */
    private _frameCount: number = 0
    /** Current frames per second. */
    private _fps: number = 0

    /** Indicates whether to show FPS counter. */
    public showFps: boolean = false;
    /** Global canvas position (for panning). */
    public _globalPosition: Vector = new Vector(0, 0)
    /** Maximum zIndex value of all shapes. */
    public _maxZIndex: number = 0
    /** Minimum zIndex value of all shapes. */
    public _minZIndex: number = 0

    /** Creator for shapes and elements. */
    public creator: RenderCreator;
    /** Manager for renderer elements. */
    public manager: RenderManager;

    /** Counter for save operations */
    private _saveCounter: number = 0;

    /**
     * Creates a new renderer instance.
     * @param canvas - The HTML canvas element where rendering will be performed.
     */
    public constructor(canvas: HTMLCanvasElement) {
        super();
        this.canvas = canvas
        this.ctx = canvas.getContext('2d') as CanvasRenderingContext2D

        this.creator = new RenderCreator(this)
        this.manager = new RenderManager(this)
        this.configuration = new RenderConfiguration(this)
        this.currentCamera = new Camera(this)
        this.snapSmart = new SnapSmart(this)
        this.history = new History(this)
        this.transformer = new Transformer(this)
        this.selection = new Selection(this)
        this.exporter = new Exporter(this)

        this.setup()
        this.start()
    }

    /**
     * Sets up the renderer by initializing all necessary components.
     * @private
     */
    private setup(): void {
        this.config()
        this.events()
        this._customEvents()
    }

    /**
     * Applies the initial configuration to the renderer.
     * @private
     */
    private config(): void {
        this.resize()
    }

    /**
     * Sets up the browser events needed for interaction.
     * @private
     */
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

    private _customEvents(): void {
        this.on("save", () => {
            this.forceSave();
        })
    }

    /**
     * Handles the key down event.
     * @param event - Keyboard event.
     * @private
     */
    private _onKeyDown(event: KeyboardEvent): void {
        if (event.key === "Control") {
            this._isZooming = true;
        }
        if (event.key === "Shift") {
            this._isShiftPressed = true;
        }
    }

    /**
     * Handles the key up event.
     * @param event - Keyboard event.
     * @private
     */
    private _onKeyUp(event: KeyboardEvent): void {
        if (event.key === "Control") {
            this._isZooming = false;
        }
        if (event.key === "Shift") {
            this._isShiftPressed = false;
        }
    }

    /**
     * Handles the mouse wheel event for zoom and panning.
     * @param event - Mouse wheel event.
     * @private
     */
    private _onMouseWheel(event: WheelEvent): void {
        event.preventDefault();
    
        if (!this.pointerInWorld(this.mousePosition())) {
            event.stopPropagation();
            return;
        }
    
        if (this._isZooming && this.configuration.config.zoom) {
            const zoomFactor = 1.05;
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
        } else {
            this._offsetPan.x -= event.deltaX / this._zoom;
            this._offsetPan.y -= event.deltaY / this._zoom;
        }
    
        if (this._wheelTimeout) {
            clearTimeout(this._wheelTimeout);
        }
        this._wheelTimeout = window.setTimeout(() => {
            this._onMouseWheelEnd();
        }, 500);
    }

    /**
     * Handles the mouse wheel end event.
     * @private
     */
    private _onMouseWheelEnd(): void {
        this.autoSave(false);        
    }

    /**
     * Handles the mouse button down event.
     * Initiates shape dragging or canvas panning.
     * @param event - Mouse event.
     * @private
     */
    private _onMouseDown(event: MouseEvent): void {
        const clickedSelectedShape = this._getChildrens().find((child: Shape) => child._isClicked());

        if (event.button == 1 && this.configuration.config.pan) {
            this._isPan = true;
            this._lastMousePos = this.worldPosition();
            return;
        }
        
        if (this.exporter.isCutting() || this.exporter.isResizing()) return;

        if (!clickedSelectedShape && this.configuration.config.selection) {
            this.emit("mousedown", this._getArgs(this))
            if (this.transformer.isClickedTransformer()) return;
            const worldPosition = this.worldPosition();
            this.selection._startPosition = worldPosition;
            this.selection._isSelecting = true;
            this.selection._justFinishedSelecting = false;
            return;
        }

        if (!clickedSelectedShape) return;

        this.emit("mousedown", this._getArgs(clickedSelectedShape))
        
        if (clickedSelectedShape && clickedSelectedShape.isSelected) {
            return;
        }

        if (clickedSelectedShape && !clickedSelectedShape.isSelected) {
            this._draggingShape = clickedSelectedShape;
            this._isDragging = false;
            this._wasDragging = false;
            this._mouseDownTime = performance.now();
            this._lastMousePos = this.worldPosition();
            return;
        }
    }

    /**
     * Handles the mouse move event.
     * Updates the mouse position and manages shape dragging and panning.
     * @param event - Mouse event.
     * @private
     */
    private _onMouseMoved(event: MouseEvent): void {
        this._mousePosition.x = event.clientX
        this._mousePosition.y = event.clientY
        if (!this.pointerInWorld(this.mousePosition())) return;

        if (this.selection._isSelecting) {
            this.selection._endPosition = this.worldPosition();
            this.selection._width = this.selection._endPosition.x - this.selection._startPosition.x;
            this.selection._height = this.selection._endPosition.y - this.selection._startPosition.y;
            return;
        }

        if (this.transformer.isDragging || this.transformer.isMovingSelection) {
            this._isDragging = false;
            this._draggingShape = null;
        }

        if (this._draggingShape && !this._isDragging) {
            const currentTime = performance.now();
            const timeSinceMouseDown = currentTime - this._mouseDownTime;
            
            if (timeSinceMouseDown >= this._dragThreshold) {
                this._isDragging = true;
                if (this.configuration.config.snap) {
                    this.snapSmart.bind(this._draggingShape);
                }
            }
        }

        if (this._isDragging && this._draggingShape) {
            const current = this.worldPosition();
            const delta = current.sub(this._lastMousePos);
            this._draggingShape.position.x += delta.x;
            this._draggingShape.position.y += delta.y;
            this._lastMousePos = current;
            this._wasDragging = true;

            if (this.configuration.config.snap) {
                this.snapSmart.update();
            }
        }

        if (this._isPan && this.configuration.config.pan) {
            const current = this.worldPosition();
            const delta = current.sub(this._lastMousePos);
            this._offsetPan.x += delta.x;
            this._offsetPan.y += delta.y;
            this._lastMousePos = current;
        }

        this.emit("mousemove", this._getArgs(this))
    }

    /**
     * Handles the mouse button up event.
     * Finalizes shape dragging and panning.
     * @private
     */
    private _onMouseUp(): void {
        this.emit("mouseup", this._getArgs(this))

        if (this.selection._isSelecting) {
            const distance = Math.sqrt(this.selection._width * this.selection._width + this.selection._height * this.selection._height);
            if (distance >= this.selection._minDistance) {
                this.selection.detectSelectedShapes();
                this.selection._justFinishedSelecting = true;
            }
        }

        this.selection._isSelecting = false;
        this.selection._startPosition = Vector.zero;
        this.selection._endPosition = Vector.zero;
        this.selection._width = 0;
        this.selection._height = 0;

        if (this._isDragging && this._draggingShape) {
            this._draggingShape.emit("dragend", this._getArgs(this._draggingShape))
            this.autoSave(true);
        }

        if (this._isPan) {
            this.autoSave(false);
        }

        this._isDragging = false;
        this._isPan = false;
        this._draggingShape = null;
        this._lastMousePos = Vector.zero;
        this._mouseDownTime = 0;

        if (this.configuration.config.snap) {
            this.snapSmart.unbind();
        }
    }

    /**
     * Handles the mouse click event.
     * Detects single and double clicks on shapes or on the canvas.
     * @private
     */
    private _onMouseClicked(): void {
        if (this.exporter.isCutting() || this.exporter.isResizing()) return;
        let clicked: Shape | null = null

        this._getChildrens().forEach((child: Shape) => {
            if (!child.visible || !child._isClicked() || clicked) return

            child.emit("click", this._getArgs(child))
            clicked = child;
        })

        const now = performance.now();
        const diff = now - this._lastTimeClick;
        if (diff < 300) {
            if (clicked) {
                (clicked as Shape).emit("dblclick", this._getArgs(clicked))

                if (this.configuration.config.transform) {
                    this.transformer.clear();
                    this.transformer.add(clicked);
                }
            } else {
                this.emit("dblclick", this._getArgs(this))
            }
            return;
        }
        this._lastTimeClick = performance.now();

        if (clicked && !this._wasDragging && this.configuration.config.transform) {
            if ((clicked as Shape).isSelected) {
                return;
            }
            
            if (this._isShiftPressed) {
                this.transformer.add(clicked as Shape);
            } else {
                this.transformer.clear();
                this.transformer.add(clicked as Shape);
            }
        }

        this._wasDragging = false;

        this.emit("click", this._getArgs(clicked ?? this))
    }

    /**
     * Handles the context menu event (right click).
     * Prevents the browser's default behavior.
     * @param event - Mouse event.
     * @private
     */
    private _onContextmenu(event: MouseEvent): void {
        event.preventDefault();
    }

    /**
     * Gets the list of all shapes ordered by their zIndex.
     * @returns Sorted list of shapes.
     * @private
     */
    private _getChildrens(): Shape[] {
        return Array.from([...this.childrens.values()]).sort((a, b) => b.zIndex - a.zIndex)
    }

    /**
     * Builds the arguments for events.
     * @param child - The shape or renderer associated with the event.
     * @returns Object with event information.
     * @private
     */
    private _getArgs<T>(child: Shape | Render): T {
        return {
            pointer: {
                absolute: this.mousePosition(),
                world: this.worldPosition(),
            },
            target: child,
        } as T
    }

    /**
     * Updates the FPS (frames per second) counter.
     * @private
     */
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

    /**
     * Displays the FPS counter in the top-right corner of the canvas.
     * @private
     */
    private _showFps() : void {
        this.ctx.save()
        const measureText = this.ctx.measureText(`FPS: ${this._fps.toFixed(2)}`);
        const textWidth = measureText.width;
        const textHeight = measureText.fontBoundingBoxAscent + measureText.fontBoundingBoxDescent;
        
        this.ctx.translate(this.canvas.width - textWidth * 1.5 - 10, textHeight + 10);
        
        this.ctx.fillStyle = "white";
        this.ctx.font = "16px Arial";
        this.ctx.fillText(`FPS: ${this._fps.toFixed(2)}`, 0, 0);
        
        this.ctx.restore()
    }

    /**
     * Debounced configuration save to prevent FPS drops during pan/zoom
     * @private
     */
    private _debouncedConfigSave(): void {
        if (this._configSaveTimeout) {
            clearTimeout(this._configSaveTimeout);
        }
        
        this._configSaveTimeout = window.setTimeout(() => {
            this._executeConfigOnlySave();
            this._configSaveTimeout = null;
        }, 150);
    }

    /**
     * Executes configuration-only save without progress callbacks for better FPS
     * @private
     */
    private async _executeConfigOnlySave(): Promise<void> {
        try {
            if (!this.configuration.config.save) return;

            if (this.configuration.config.save === "indexeddb") {
                const configurationTable = this._database?.getTable("configurations" as never);
                if (configurationTable) {
                    await this._saveConfiguration(configurationTable);
                }
            } else if (this.configuration.config.save === "localstorage") {
                localStorage.setItem("canvasConfiguration", JSON.stringify(this.getProperties()));
            }
        } catch (error) {
            console.error('Error in config-only save:', error);
        }
    }

    /**
     * Executes the save operation.
     * @private
     */
    private async _executeSave(history: boolean): Promise<void> {
        try {
            const newData = await this._serializeAsync();
            const serializedString = JSON.stringify(newData);

            const dataHasChanged = serializedString !== this._lastSerializedData;

            this._saveCounter++;

            if (history) {
                this.history.save(newData);
            }

            if (!this.configuration.config.save) return;

            if (this.configuration.config.save === "localstorage") {
                await this._saveToLocalStorage(serializedString, dataHasChanged);
            } else if (this.configuration.config.save === "indexeddb") {
                await this._saveToIndexedDB(newData, dataHasChanged);
            }

            if (dataHasChanged) {
                this._lastSerializedData = serializedString;
            }

        } catch (error) {
            console.error('Error in _executeSave:', error);
        }
    }

    /**
     * Serializes the canvas data asynchronously.
     * @private
     */
    private async _serializeAsync(): Promise<ShapeRawData[]> {
        return new Promise((resolve) => {
            if ('requestIdleCallback' in window) {
                (window as any).requestIdleCallback(() => {
                    resolve(this.serialize());
                });
            } else {
                setTimeout(() => {
                    resolve(this.serialize());
                }, 0);
            }
        });
    }

    /**
     * Save optimized for localStorage
     * @private
     */
    private async _saveToLocalStorage(serializedString: string, dataHasChanged: boolean): Promise<void> {
        const sizeKB = serializedString.length / 1024;
        
        if (this._saveCounter % 10 === 0) {
            console.log(`Save #${this._saveCounter} - Size: ${sizeKB.toFixed(2)} KB`);
        }

        await new Promise<void>((resolve) => {
            setTimeout(() => {
                try {
                    if (dataHasChanged) {
                        localStorage.setItem("canvasData", serializedString);
                    }
                    localStorage.setItem("canvasConfiguration", JSON.stringify(this.getProperties()));
                    resolve();
                } catch (error) {
                    console.error('Error saving to localStorage:', error);
                    resolve();
                }
            }, 0);
        });
    }

    /**
     * Save optimized for IndexedDB using web workers
     * @private
     */
    private async _saveToIndexedDB(newData: ShapeRawData[], dataHasChanged: boolean): Promise<void> {
        try {
            const table = this._database?.getTable("nodes" as never);
            const configurationTable = this._database?.getTable("configurations" as never);
            
            if (!configurationTable || !table) {
                console.warn('Database tables not available');
                return;
            }

            const progressCallback = this.onSavingProgress;
            
            if (progressCallback) {
                progressCallback({ p: 0, state: true });
                await new Promise(resolve => setTimeout(resolve, 50));
            }

            if (dataHasChanged) {
                await table.putMany(newData as never, true, 50, progressCallback ? (progress) => {
                    progressCallback({ p: progress.p * 0.9, state: true });
                } : undefined);

                if (progressCallback) {
                    progressCallback({ p: 0.95, state: true });
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            } else if (progressCallback) {
                progressCallback({ p: 0.95, state: true });
                await new Promise(resolve => setTimeout(resolve, 50));
            }
            
            await this._saveConfiguration(configurationTable);
            
            if (progressCallback) {
                await new Promise(resolve => setTimeout(resolve, 100));
                progressCallback({ p: 1, state: false });
            }

        } catch (error) {
            console.error('Error saving to IndexedDB:', error);
            if (this.onSavingProgress) {
                this.onSavingProgress({ p: 0, state: false });
            }
        }
    }

    /**
     * Save configuration optimized
     * @private
     */
    private async _saveConfiguration(configurationTable: any): Promise<void> {
        try {
            const configData = { id: "data", ...this.getProperties() };
            
            await configurationTable.put(configData as never);
        } catch (error) {
            console.error('Error saving configuration:', error);
        }
    }

    /**
     * Clears the canvas to prepare it for the next frame.
     * @private
     */
    private _clear(): void {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    }

    /**
     * Main rendering function called on each animation frame.
     * Updates the camera, renders all shapes, and displays the FPS.
     */
    public _render(): void {
        this._clear()

        this.ctx.save()
        this.ctx.translate(this._globalPosition.x, this._globalPosition.y)
        this.ctx.scale(this._zoom, this._zoom)

        this.currentCamera.update()

        this._getChildrens().reverse().forEach((child: Shape) => {
            child.update()
        })

        if (this.configuration.config.snap) {
            this.snapSmart.drawGuides()
        }

        this.transformer.update()
        this.selection.update()
        this.ctx.restore()

        this.ctx.save()

        if (this.showFps) {
            this._updateFps()
            this._showFps()
        }

        this.exporter.update()
        this.ctx.restore()

        this.emit("update", {})
        this._frameId = requestAnimationFrame(this._renderBound)
    }

    /**
     * Gets the currently dragged shape.
     * @returns The currently dragged shape, or null if no shape is being dragged.
     */
    public get draggingShape(): Shape | null {
        return this._draggingShape;
    }

    /**
     * Gets the current zoom factor.
     * @returns The zoom factor.
     */
    public get zoom(): number {
        return this._zoom;
    }

    /**
     * Gets the current offset pan.
     * @returns The offset pan.
     */
    public get offsetPan(): Vector {
        return this._offsetPan;
    }

    /**
     * Gets the list of all shapes present on the canvas.
     * @returns List of shapes ordered by zIndex.
     */
    public get childs(): Shape[] {
        return this._getChildrens();
    }

    /**
     * Gets the database instance associated with this render.
     * @returns The database instance.
     */
    public get database(): Database | null {
        return this._database;
    }
    
    /**
     * Allows the display of the FPS counter.
     */
    public allowFps(): void {
        this.showFps = true;
    }

    /**
     * Disallows the display of the FPS counter.
     */
    public disallowFps(): void {
        this.showFps = false;
    }

    /**
     * Sets the properties of the renderer.
     * @param properties - Object containing the properties to set.
     */
    public setProperties(props: Partial<RenderProperties>) {
        if (props.zoom !== undefined) {
            this._zoom = props.zoom;
        }
        if (props.globalPosition !== undefined) {
            this._globalPosition = props.globalPosition;
        }
        if (props.offsetPan !== undefined) {
            this._offsetPan = props.offsetPan;
        }
    }

    /**
     * @internal
     * Prepares the renderer for export by hiding the transformer and disallowing the FPS counter.
     */
    public preExport(): void {
        this.transformer.hide();
        this.disallowFps();
    }

    /**
     * @internal
     * Restores the renderer after export by showing the transformer and allowing the FPS counter.
     */
    public postExport(): void {
        this.transformer.show();
        this.allowFps();
    }

    /**
     * Gets the current properties of the renderer.
     * @returns Object containing the current zoom, global position, and offset pan.
     */
    public getProperties(): RenderProperties {
        return {
            zoom: this._zoom,
            globalPosition: this._globalPosition,
            offsetPan: this._offsetPan
        };
    }

    /**
     * Adjusts the canvas size to match its visual size.
     */
    public resize(): void {
        const { width, height } = this.canvas.getBoundingClientRect()
        this.canvas.width = width
        this.canvas.height = height
    }

    /**
     * Gets the current mouse position in absolute window coordinates.
     * @returns Vector with the mouse position.
     */
    public mousePosition(): Vector {
        return this._mousePosition;
    }

    /**
     * Gets the mouse position relative to the canvas.
     * @returns Vector with the relative mouse position.
     */
    public relativePosition(): Vector {
        const { left, top } = this.canvas.getBoundingClientRect()
        return this.mousePosition().sub(new Vector(left, top));
    }

    /**
     * Gets the mouse position in world coordinates (taking into account zoom and panning).
     * @returns Vector with the world position.
     */
    public worldPosition(): Vector {
        return this.toWorldCoordinates(this.mousePosition());
    }

    /**
     * Converts an absolute position to world coordinates.
     * @param vector - Vector with absolute coordinates.
     * @returns Vector with world coordinates.
     */
    public toWorldCoordinates(vector: Vector): Vector {
        const rect = this.canvas.getBoundingClientRect()
        const x = vector.x - rect.left
        const y = vector.y - rect.top
        return new Vector((x - this._globalPosition.x) / this._zoom, (y - this._globalPosition.y) / this._zoom)
    }

    /**
     * Converts a world position to screen coordinates.
     * @param vector - Vector with world coordinates.
     * @returns Vector with screen coordinates.
     */
    public toScreenCoordinates(vector: Vector): Vector {
        return new Vector(vector.x - this.currentCamera.offset.x, vector.y - this.currentCamera.offset.y);
    }

    /**
     * Converts a world position to absolute coordinates.
     * @param vector - Vector with world coordinates.
     * @returns Vector with absolute coordinates.
     */
    public toAbsoluteCoordinates(vector: Vector): Vector {
        const rect = this.canvas.getBoundingClientRect()
        const x = vector.x * this._zoom + this._globalPosition.x
        const y = vector.y * this._zoom + this._globalPosition.y
        return new Vector(x + rect.left, y + rect.top)
    }

    /**
     * Converts a world position to relative coordinates.
     * @param vector - Vector with world coordinates.
     * @returns Vector with relative coordinates.
     */
    public toRelativeCoordinates(vector: Vector): Vector {
        const rect = this.canvas.getBoundingClientRect()
        const x = vector.x
        const y = vector.y
        return new Vector(x - rect.left, y - rect.top)
    }

    /**
     * Determines if a point is within the visible area of the canvas.
     * @param pointer - Vector with the position to check.
     * @returns true if the point is inside the canvas, false otherwise.
     */
    public pointerInWorld(pointer: Vector): boolean {
        const { left, top } = this.canvas.getBoundingClientRect()
        const x = pointer.x - left
        const y = pointer.y - top
        return x >= 0 && x <= this.canvas.width && y >= 0 && y <= this.canvas.height
    }

    /**
     * Gets the offset pan.
     * @returns Vector with the offset pan.
     */
    public getOffset(): Vector {
        return this.currentCamera.offset.sub(this._offsetPan);
    }

    /**
     * Método para forzar save inmediato (útil para casos específicos)
     */
    public forceSave(): void {
        this.autoSave(true);
    }


    /**
     * Undoes the last operation in history.
     */
    public undo(): void {
        this.history.undo()
    }

    /**
     * Redoes the last undone operation.
     */
    public redo(): void {
        this.history.redo()
    }

    public async getSizeData(format: "mb" | "kb" | "bytes"): Promise<number | null> {
        let sizeMB = null;
        if (this.configuration.config.save === "localstorage") {
            sizeMB = new Blob([JSON.stringify(this.serialize())]).size / (1024 * 1024);
        } else if(this.configuration.config.save === "indexeddb") {
            sizeMB = await this.database?.getDatabaseSizeMB() ?? 0;
        }

        if (sizeMB && format === "mb") return sizeMB;
        if (sizeMB && format === "kb") return sizeMB * 1024;
        if (sizeMB && format === "bytes") return sizeMB * 1024 * 1024;

        return sizeMB
    }

    /**
     * Automatically saves the current state of the canvas.
     * @param history - If true, adds the save to history; otherwise just saves without adding to history.
     */
    public autoSave(history: boolean = true): void {
        if (!history) {
            this._debouncedConfigSave();
        } else {
            this._executeSave(history);
        }
    }

    /**
     * Loads the canvas state from serialized data.
     * @param defaultData - Serialized shape data.
     */
    public async load(defaultData?: ShapeRawData[]): Promise<void> {
        if (defaultData) {
            if (this.onLoadProgress) {
                this.onLoadProgress({ p: 0, state: true });
                await new Promise(resolve => setTimeout(resolve, 50));
            }

            this.emit("load", { data: defaultData });
            
            if (this.onLoadProgress) {
                this.onLoadProgress({ p: 0.5, state: true });
                await new Promise(resolve => setTimeout(resolve, 50));
            }

            this.deserialize(defaultData);
            
            if (this.onLoadProgress) {
                this.onLoadProgress({ p: 0.9, state: true });
                await new Promise(resolve => setTimeout(resolve, 50));
            }

            this._lastSerializedData = JSON.stringify(defaultData);
            
            if (this.onLoadProgress) {
                this.onLoadProgress({ p: 1, state: false });
            }
            
            return;
        }

        if (!this.configuration.config.save) return;
        if (typeof window === "undefined") {
            console.warn("Render.load(): No browser environment (localStorage/cookies not available).");
            return;
        }
    
        let data: ShapeRawData[] | null = null;
    
        try {
            if (this.onLoadProgress) {
                this.onLoadProgress({ p: 0, state: true });
                await new Promise(resolve => setTimeout(resolve, 50));
            }

            if (this.configuration.config.save === "localstorage") {
                if (this.onLoadProgress) {
                    this.onLoadProgress({ p: 0.2, state: true });
                }

                const localData = localStorage.getItem("canvasData");
                if (localData) {
                    data = JSON.parse(localData);
                }

                if (this.onLoadProgress) {
                    this.onLoadProgress({ p: 0.5, state: true });
                }

                const localConfiguration = localStorage.getItem("canvasConfiguration");
                if (localConfiguration) {
                    this.setProperties(JSON.parse(localConfiguration));
                }

                if (this.onLoadProgress) {
                    this.onLoadProgress({ p: 0.7, state: true });
                }
            } else if (this.configuration.config.save === "indexeddb" && this._database) {
                if (this.onLoadProgress) {
                    this.onLoadProgress({ p: 0.2, state: true });
                }

                const data0 = await this._database.get("nodes" as never)?.getAll();
                
                if (this.onLoadProgress) {
                    this.onLoadProgress({ p: 0.5, state: true });
                }

                const data1 = await this._database.get("configurations" as never)?.getAll();
                
                if (this.onLoadProgress) {
                    this.onLoadProgress({ p: 0.7, state: true });
                }

                if (data0) {
                    data = data0;
                }

                if (data1) {
                    this.setProperties(data1[0] as never);
                }
            }
    
            if (data && Array.isArray(data)) {
                if (this.onLoadProgress) {
                    this.onLoadProgress({ p: 0.8, state: true });
                    await new Promise(resolve => setTimeout(resolve, 50));
                }

                this.emit("load", { data });
                this.deserialize(data);
                this.history.save(data);
                
                if (this.onLoadProgress) {
                    this.onLoadProgress({ p: 0.95, state: true });
                    await new Promise(resolve => setTimeout(resolve, 50));
                }

                this._lastSerializedData = JSON.stringify(data);
            }

            if (this.onLoadProgress) {
                this.onLoadProgress({ p: 1, state: false });
            }
        } catch (error) {
            console.error("Error loading canvas data:", error);
            if (this.onLoadProgress) {
                this.onLoadProgress({ p: 0, state: false });
            }
        }
    }
    

    /**
     * Serializes all shapes on the canvas to JSON format.
     * @returns Array of serialized shape data.
     */
    public serialize(): ShapeRawData[] {
        return Array.from(this.childrens.values()).map((child: Shape) => child._rawData());
    }

    /**
     * Recreates shapes from serialized data.
     * @param data - Serialized shape data.
     */
    public deserialize(data: ShapeRawData[]): void {
        this.childrens.clear();
        data.forEach((child: ShapeRawData) => {
            if (child.type === "rect") {
                Rect._fromRawData(child as RectRawData, this);
            } else if (child.type === "circle") {
                Circle._fromRawData(child as CircleRawData, this);
            } else if (child.type === "text") {
                Text._fromRawData(child as TextRawData, this);
            } else if (child.type === "image") {
                Image._fromRawData(child as ImageRawData, this);
            }
        });
    }

    /**
     * Loads a new configuration for the renderer.
     * @param config - Configuration object.
     */
    public async loadConfiguration(config: RenderConfigurationProps): Promise<void> {
        this.configuration.load(config)
        
        if (this.configuration.config.save === "indexeddb") {
            this._database = new Database('myDatabase', 1);

            this._database.createTable<"nodes", NodeSchema>({
                name: "nodes",
                primary: "id",
            })

            this._database.createTable<"configurations", ConfigurationSchema>({
                name: "configurations",
                primary: "id",
            })

            await this._database.init();
        }

        await this.load()
    }

    /**
     * Generates a random integer within a specified range.
     * @param min - Minimum value (inclusive).
     * @param max - Maximum value (inclusive).
     * @returns Random integer.
     */
    public static randomInt(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /**
     * Generates a random float within a specified range.
     * @param min - Minimum value (inclusive).
     * @param max - Maximum value (exclusive).
     * @returns Random float.
     */
    public static randomFloat(min: number, max: number): number {
        return Math.random() * (max - min) + min;
    }

    /**
     * Performs linear interpolation between two values.
     * @param start - Initial value.
     * @param end - Final value.
     * @param t - Interpolation factor (0-1).
     * @returns Interpolated value.
     */
    public static lerp(start: number, end: number, t: number): number {
        return start + (end - start) * t;
    }

    /**
     * Starts the rendering loop.
     */
    public start(): void {
        if (this._frameId) return
        this._frameId = requestAnimationFrame(this._renderBound)
    }

    /**
     * Stops the rendering loop.
     */
    public stop(): void {
        if (!this._frameId) return
        cancelAnimationFrame(this._frameId)
        this._frameId = null
    }

    /**
     * Cleans up all resources and removes event listeners.
     * Should be called before removing the renderer instance.
     */
    public cleanup(): void {
        if (this._frameId !== null) {
            cancelAnimationFrame(this._frameId);
            this._frameId = null;
        }

        if (this._configSaveTimeout) {
            clearTimeout(this._configSaveTimeout);
            this._configSaveTimeout = null;
        }

        this.canvas.removeEventListener("contextmenu", this._onContextmenuBound);
        this.canvas.removeEventListener("click", this._onMouseClickedBound);
        this.canvas.removeEventListener("mousedown", this._onMouseDownBound);
        this.canvas.removeEventListener("mousemove", this._onMouseMovedBound);
        this.canvas.removeEventListener("mouseup", this._onMouseUpBound);
        this.canvas.removeEventListener("wheel", this._onMouseWheelBound);
        document.removeEventListener("keydown", this._onKeyDownBound);
        document.removeEventListener("keyup", this._onKeyUpBound);
        window.removeEventListener("resize", this._resizeBound);
    }
}