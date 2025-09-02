import { RenderCreator } from "./helpers/Render.creator";
import { Vector } from "./instances/common/Vector";
import { Shape } from "./instances/Shape";
import { RenderManager } from "./managers/Render.manager";
import { RenderProvider } from "./providers/Render.provider";
import { RenderConfiguration, type RenderConfigurationProps } from "./helpers/Render.config";
import { Camera } from "./instances/common/Camera";
import { History } from "./instances/utils/History";
import { SnapSmart } from "./instances/utils/SnapSmart";
import { CircleRawData, RectRawData, ShapeRawData, TextRawData } from "./types/Raw";
import { Rect } from "./instances/_shapes/Rect";
import { Circle } from "./instances/_shapes/Circle";
import { Text } from "./instances/_shapes/Text";

/**
 * Clase principal del sistema de renderizado.
 * Gestiona el canvas, los eventos del ratón, el zoom, el desplazamiento y las formas dibujadas.
 *
 * @example
 * ```ts
 * const canvas = document.getElementById('canvas') as HTMLCanvasElement;
 * const render = new Render(canvas);
 * const rect = new Rect(render, { x: 100, y: 100, width: 200, height: 100 });
 * ```
 */
export class Render extends RenderProvider {
    /** Elemento canvas HTML que se utilizará para el renderizado. */
    public canvas: HTMLCanvasElement
    /** Contexto 2D del canvas para operaciones de dibujo. */
    public ctx: CanvasRenderingContext2D

    /** Cámara actual que controla la vista del canvas. */
    public currentCamera: Camera;
    /** Mapa de todas las formas en el canvas, indexadas por su ID. */
    public childrens: Map<string, Shape> = new Map();
    /** Configuración del sistema de renderizado. */
    public configuration: RenderConfiguration;
    /** Sistema de historial para operaciones de deshacer/rehacer. */
    public history: History;
    /** Sistema de alineación inteligente para las formas. */
    public snapSmart: SnapSmart;

    /** Datos serializados de las formas para autoguardado. */
    private _data: ShapeRawData[] = [];

    /** ID del frame de animación actual. */
    private _frameId: number | null = null
    /** Función de renderizado vinculada para mantener el contexto correcto. */
    private _renderBound: () => void = this._render.bind(this)
    /** Función de redimensionamiento vinculada para mantener el contexto correcto. */
    private _resizeBound: () => void = this._resize.bind(this)
    /** Función para el menú contextual vinculada para mantener el contexto correcto. */
    private _onContextmenuBound: (event: MouseEvent) => void = this._onContextmenu.bind(this);

    /** Función para click del ratón vinculada. */
    private _onMouseClickedBound: (event: MouseEvent) => void = this._onMouseClicked.bind(this);
    /** Función para pulsar botón del ratón vinculada. */
    private _onMouseDownBound: (event: MouseEvent) => void = this._onMouseDown.bind(this);
    /** Función para movimiento del ratón vinculada. */
    private _onMouseMovedBound: (event: MouseEvent) => void = this._onMouseMoved.bind(this);
    /** Función para soltar botón del ratón vinculada. */
    private _onMouseUpBound: (event: MouseEvent) => void = this._onMouseUp.bind(this);
    /** Función para rueda del ratón vinculada. */
    private _onMouseWheelBound: (event: WheelEvent) => void = this._onMouseWheel.bind(this);
    /** Función para tecla pulsada vinculada. */
    private _onKeyDownBound: (event: KeyboardEvent) => void = this._onKeyDown.bind(this);
    /** Función para tecla soltada vinculada. */
    private _onKeyUpBound: (event: KeyboardEvent) => void = this._onKeyUp.bind(this);

    /** Forma que está siendo arrastrada actualmente. */
    private _draggingShape: Shape | null = null

    /** Posición actual del ratón en coordenadas absolutas. */
    private _mousePosition: Vector = new Vector(0, 0)
    /** Última posición registrada del ratón. */
    private _lastMousePos: Vector = new Vector(0, 0)

    /** Indica si el modo zoom está activo (tecla Ctrl pulsada). */
    private _isZooming: boolean = false
    /** Indica si el modo desplazamiento está activo. */
    private _isPan: boolean = false
    /** Indica si se está arrastrando una forma. */
    private _isDragging: boolean = false

    /** Factor de zoom actual. */
    private _zoom: number = 1

    /** Último tiempo registrado de un click para detectar doble click. */
    private _lastTimeClick: number = performance.now();
    /** Último tiempo registrado para calcular FPS. */
    private _lastFrameTime: number = performance.now()
    /** Contador de frames para calcular FPS. */
    private _frameCount: number = 0
    /** Frames por segundo actuales. */
    private _fps: number = 0

    /** Posición global del canvas (para desplazamiento). */
    public _globalPosition: Vector = new Vector(0, 0)
    /** Valor máximo de zIndex de todas las formas. */
    public _maxZIndex: number = 0
    /** Valor mínimo de zIndex de todas las formas. */
    public _minZIndex: number = 0

    /** Creador de formas y elementos. */
    public creator: RenderCreator;
    /** Gestor de elementos del renderizador. */
    public manager: RenderManager;

    /**
     * Crea una nueva instancia del renderizador.
     * @param canvas - El elemento canvas HTML donde se realizará el renderizado.
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

        this.setup()
        this.start()
    }

    /**
     * Configura el renderizador inicializando todos los componentes necesarios.
     * @private
     */
    private setup(): void {
        this.config()
        this.events()
        this.autoSave()
    }

    /**
     * Aplica la configuración inicial al renderizador.
     * @private
     */
    private config(): void {
        this._resize()
    }

    /**
     * Configura los eventos del navegador necesarios para la interacción.
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

    /**
     * Maneja el evento de tecla pulsada.
     * @param event - Evento de teclado.
     * @private
     */
    private _onKeyDown(event: KeyboardEvent): void {
        if (event.key === "Control") {
            this._isZooming = true;
        }
    }

    /**
     * Maneja el evento de tecla soltada.
     * @param event - Evento de teclado.
     * @private
     */
    private _onKeyUp(event: KeyboardEvent): void {
        if (event.key === "Control") {
            this._isZooming = false;
        }
    }

    /**
     * Maneja el evento de la rueda del ratón para zoom y desplazamiento.
     * @param event - Evento de la rueda del ratón.
     * @private
     */
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

    /**
     * Maneja el evento de botón del ratón pulsado.
     * Inicia el arrastre de formas o el desplazamiento del canvas.
     * @param event - Evento del ratón.
     * @private
     */
    private _onMouseDown(event: MouseEvent): void {
        this.emit("mousedown", this._getArgs(this))

        this._draggingShape = this._getChildrens().find((child: Shape) => child._isClicked()) ?? null;

        if (this._draggingShape) {
            this._isDragging = true;
            this._lastMousePos = this.worldPosition();

            if (this.configuration.config.snap) {
                this.snapSmart.bind(this._draggingShape);
            }
            return;
        }

        if (event.button == 1 && this.configuration.config.pan) {
            this._isPan = true;
            this._lastMousePos = this.worldPosition();
        }
    }

    /**
     * Maneja el evento de movimiento del ratón.
     * Actualiza la posición del ratón y gestiona el arrastre de formas y desplazamiento.
     * @param event - Evento del ratón.
     * @private
     */
    private _onMouseMoved(event: MouseEvent): void {
        this._mousePosition.x = event.clientX
        this._mousePosition.y = event.clientY
        if (!this.pointerInWorld(this.mousePosition())) return;

        if (this._isDragging && this._draggingShape) {
            const current = this.worldPosition();
            const delta = current.sub(this._lastMousePos);
            this._draggingShape.position.x += delta.x;
            this._draggingShape.position.y += delta.y;
            this._lastMousePos = current;

            if (this.configuration.config.snap) {
                this.snapSmart.update();
            }
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

        this.emit("mousemove", this._getArgs(this))
    }

    /**
     * Maneja el evento de botón del ratón soltado.
     * Finaliza el arrastre de formas y el desplazamiento.
     * @private
     */
    private _onMouseUp(): void {
        this.emit("mouseup", this._getArgs(this))

        if (this._isDragging && this._draggingShape) {
            this._draggingShape.emit("dragend", this._getArgs(this._draggingShape))
        }

        this._isDragging = false;
        this._isPan = false;
        this._draggingShape = null;
        this._lastMousePos = Vector.zero;

        if (this.configuration.config.snap) {
            this.snapSmart.unbind();
        }
    }

    /**
     * Maneja el evento de click del ratón.
     * Detecta clicks simples y dobles en las formas o en el canvas.
     * @private
     */
    private _onMouseClicked(): void {
        let clicked: Shape | null = null

        this._getChildrens().forEach((child: Shape) => {
            if (!child.visible || !child._isClicked() || clicked) return

            child.emit("click", this._getArgs(child))
            clicked = child;
        })

        const now = performance.now();
        const diff = now - this._lastTimeClick;
        if (diff < 300) {
            if (clicked) (clicked as Shape).emit("dblclick", this._getArgs(clicked))
            else this.emit("dblclick", this._getArgs(this))
            return;
        }
        this._lastTimeClick = performance.now();

        this.emit("click", this._getArgs(clicked ?? this))
    }

    /**
     * Maneja el evento de menú contextual (click derecho).
     * Previene el comportamiento por defecto del navegador.
     * @param event - Evento del ratón.
     * @private
     */
    private _onContextmenu(event: MouseEvent): void {
        event.preventDefault();
    }

    /**
     * Obtiene la lista de todas las formas ordenadas por su zIndex.
     * @returns Lista ordenada de formas.
     * @private
     */
    private _getChildrens(): Shape[] {
        return Array.from([...this.childrens.values()]).sort((a, b) => b.zIndex - a.zIndex)
    }

    /**
     * Construye los argumentos para los eventos.
     * @param child - La forma o el renderizador asociado al evento.
     * @returns Objeto con información del evento.
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
     * Ajusta el tamaño del canvas para que coincida con su tamaño visual.
     * @private
     */
    private _resize(): void {
        const { width, height } = this.canvas.getBoundingClientRect()
        this.canvas.width = width
        this.canvas.height = height
    }

    /**
     * Actualiza el contador de FPS (frames por segundo).
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
     * Muestra el contador de FPS en la esquina superior derecha del canvas.
     * @private
     */
    private _showFps() : void {
        const measureText = this.ctx.measureText(`FPS: ${this._fps.toFixed(2)}`);
        const textWidth = measureText.width;
        const textHeight = measureText.fontBoundingBoxAscent + measureText.fontBoundingBoxDescent;
        
        this.ctx.fillStyle = "white";
        this.ctx.font = "16px Arial";
        this.ctx.fillText(`FPS: ${this._fps.toFixed(2)}`, this.canvas.width - textWidth * 1.5 - 10, textHeight + 10);
    }

    /**
     * Limpia el canvas para prepararlo para el siguiente frame.
     * @private
     */
    private _clear(): void {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    }

    /**
     * Función principal de renderizado llamada en cada frame de animación.
     * Actualiza la cámara, renderiza todas las formas y muestra los FPS.
     * @private
     */
    private _render(): void {
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

        this.ctx.restore()

        this.ctx.save()
        this._updateFps()
        this._showFps()
        this.ctx.restore()

        this.emit("update", {})
        this._frameId = requestAnimationFrame(this._renderBound)
    }

    /**
     * Obtiene el factor de zoom actual.
     * @returns El factor de zoom.
     */
    public get zoom(): number {
        return this._zoom;
    }

    /**
     * Obtiene la lista de todas las formas presentes en el canvas.
     * @returns Lista de formas ordenadas por zIndex.
     */
    public get childs(): Shape[] {
        return this._getChildrens();
    }

    /**
     * Obtiene la posición actual del ratón en coordenadas absolutas de la ventana.
     * @returns Vector con la posición del ratón.
     */
    public mousePosition(): Vector {
        return this._mousePosition;
    }

    /**
     * Obtiene la posición del ratón relativa al canvas.
     * @returns Vector con la posición relativa del ratón.
     */
    public relativePosition(): Vector {
        const { left, top } = this.canvas.getBoundingClientRect()
        return this.mousePosition().sub(new Vector(left, top));
    }

    /**
     * Obtiene la posición del ratón en coordenadas del mundo (teniendo en cuenta zoom y desplazamiento).
     * @returns Vector con la posición del mundo.
     */
    public worldPosition(): Vector {
        return this.toWorldCoordinates(this.mousePosition());
    }

    /**
     * Convierte una posición absoluta a coordenadas del mundo.
     * @param vector - Vector con coordenadas absolutas.
     * @returns Vector con coordenadas del mundo.
     */
    public toWorldCoordinates(vector: Vector): Vector {
        const rect = this.canvas.getBoundingClientRect()
        const x = vector.x - rect.left
        const y = vector.y - rect.top
        return new Vector((x - this._globalPosition.x) / this._zoom, (y - this._globalPosition.y) / this._zoom)
    }

    /**
     * Convierte una posición del mundo a coordenadas absolutas.
     * @param vector - Vector con coordenadas del mundo.
     * @returns Vector con coordenadas absolutas.
     */
    public toAbsoluteCoordinates(vector: Vector): Vector {
        const rect = this.canvas.getBoundingClientRect()
        const x = vector.x * this._zoom + this._globalPosition.x
        const y = vector.y * this._zoom + this._globalPosition.y
        return new Vector(x + rect.left, y + rect.top)
    }

    /**
     * Determina si un punto está dentro del área visible del canvas.
     * @param pointer - Vector con la posición a comprobar.
     * @returns true si el punto está dentro del canvas, false en caso contrario.
     */
    public pointerInWorld(pointer: Vector): boolean {
        const { left, top } = this.canvas.getBoundingClientRect()
        const x = pointer.x - left
        const y = pointer.y - top
        return x >= 0 && x <= this.canvas.width && y >= 0 && y <= this.canvas.height
    }

    /**
     * Deshace la última operación en el historial.
     */
    public undo(): void {
        this.history.undo()
    }

    /**
     * Rehace la última operación deshecha.
     */
    public redo(): void {
        this.history.redo()
    }

    /**
     * Guarda automáticamente el estado actual del canvas.
     */
    public autoSave(): void {
        this._data = this.serialize();
        this.emit("save", this._data);
    }

    /**
     * Serializa todas las formas del canvas a un formato JSON.
     * @returns Array de datos serializados de las formas.
     */
    public serialize(): ShapeRawData[] {
        return Array.from(this.childrens.values()).map((child: Shape) => child._rawData());
    }

    /**
     * Recrea las formas a partir de datos serializados.
     * @param data - Datos serializados de las formas.
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
            }
        });
    }

    /**
     * Carga una nueva configuración para el renderizador.
     * @param config - Objeto de configuración.
     */
    public loadConfiguration(config: RenderConfigurationProps): void {
        this.configuration.load(config)
    }

    /**
     * Genera un número entero aleatorio en un rango especificado.
     * @param min - Valor mínimo (inclusive).
     * @param max - Valor máximo (inclusive).
     * @returns Número entero aleatorio.
     */
    public static randomInt(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /**
     * Genera un número decimal aleatorio en un rango especificado.
     * @param min - Valor mínimo (inclusive).
     * @param max - Valor máximo (exclusive).
     * @returns Número decimal aleatorio.
     */
    public static randomFloat(min: number, max: number): number {
        return Math.random() * (max - min) + min;
    }

    /**
     * Realiza una interpolación lineal entre dos valores.
     * @param start - Valor inicial.
     * @param end - Valor final.
     * @param t - Factor de interpolación (0-1).
     * @returns Valor interpolado.
     */
    public static lerp(start: number, end: number, t: number): number {
        return start + (end - start) * t;
    }

    /**
     * Inicia el bucle de renderizado.
     */
    public start(): void {
        if (this._frameId) return
        this._frameId = requestAnimationFrame(this._renderBound)
    }

    /**
     * Detiene el bucle de renderizado.
     */
    public stop(): void {
        if (!this._frameId) return
        cancelAnimationFrame(this._frameId)
        this._frameId = null
    }

    /**
     * Limpia todos los recursos y elimina los eventos.
     * Debe llamarse antes de eliminar la instancia del renderizador.
     */
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