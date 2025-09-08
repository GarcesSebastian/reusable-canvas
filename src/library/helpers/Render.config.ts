import { Vector } from "../instances/common/Vector";
import { Shape } from "../instances/Shape";
import { Render } from "../Render";
import { CircleRawData, ImageRawData, RectRawData, ShapeRawData, TextRawData } from "../types/Raw";
import { v4 as uuidv4 } from "uuid";
import type { RenderEventsType } from "../types/RenderProvider";
import { Rect } from "../instances/_shapes/Rect";
import { Circle } from "../instances/_shapes/Circle";
import { Text } from "../instances/_shapes/Text";
import { Image } from "../instances/_shapes/Image";

/**
 * Interface defining keyboard shortcut mappings for canvas operations.
 * Each property represents a specific operation and its associated key combination.
 * Key combinations are specified as strings in the format "key1+key2", e.g., "ctrl+z".
 */
export interface Keys {
    undo: string,
    redo: string,
    save: string,
    copy: string,
    cut: string,
    paste: string,
    duplicate: string,
    delete: string,
    selectAll: string,
    top: string,
    bottom: string,
    front: string,
    back: string,
}

export type AutoSaveMethods = "localstorage" | "indexeddb" | null

/**
 * Configuration properties for the render system.
 * Controls which features are enabled and defines keyboard shortcuts.
 */
export interface RenderConfigurationProps {
    history?: boolean,
    pan?: boolean,
    zoom?: boolean,
    snap?: boolean,
    transform?: boolean,
    selection?: boolean,
    save?: AutoSaveMethods,
    keywords?: Keys   
}

/**
 * Maps event names to arrays of key combinations.
 * Example: { "copy": ["ctrl", "c"] } for mapping Ctrl+C to the "copy" action.
 */
export type RenderKeywords = Record<string, string[]> // -> { [key: string]: string[] } --> { "copy": ["ctrl", "c"] }

/**
 * Manages configuration settings and keyboard shortcuts for the canvas renderer.
 * Handles initialization of features like history, pan, zoom, and keyboard bindings.
 *
 * @example
 * ```ts
 * const config = new RenderConfiguration(render, {
 *   history: true,
 *   pan: true,
 *   zoom: true
 * });
 * ```
 */
export class RenderConfiguration {
    /** Reference to the main render context. */
    private _render: Render;
    /** Configuration options for the renderer. */
    private _config: RenderConfigurationProps
    /** Processed keyboard shortcuts mapped to actions. */
    private _keywords: RenderKeywords = {};

    /** Store bound functions to ensure proper removal */
    private _boundHandleKeyDown: (event: KeyboardEvent) => void;
    private _boundPasteContent: (event: ClipboardEvent) => void;

    /**
     * Creates a new RenderConfiguration instance.
     * @param render - The main Render context.
     * @param config - Optional configuration options. If not provided, defaults will be used.
     */
    public constructor(render: Render, config?: RenderConfigurationProps) {
        this._render = render;
        this._config = config || {
            history: false,
            pan: false,
            zoom: false,
            snap: false,
            transform: false,
            selection: false,
            save: null,
            keywords: RenderConfiguration.defaultKeyWords()
        }

        this._boundHandleKeyDown = this._handleKeyDown.bind(this);
        this._boundPasteContent = this._pasteContent.bind(this);

        this.setup();
    }

    /**
     * Handles keyboard events and triggers corresponding renderer actions.
     * Detects modifier keys (Ctrl, Shift, Alt, Meta) and matches key combinations
     * to configured actions.
     * @param event - The keyboard event to process.
     * @private
     */
    private _handleKeyDown = (event: KeyboardEvent) => {
        for (const [key, keys] of Object.entries(this._keywords)) {
            const pressedKeys: string[] = [];
            
            if (event.ctrlKey) pressedKeys.push("ctrl");
            if (event.shiftKey) pressedKeys.push("shift");
            if (event.altKey) pressedKeys.push("alt");
            if (event.metaKey) pressedKeys.push("meta");
            
            const mainKey = event.key.toLowerCase();
            if (!["control", "shift", "alt", "meta"].includes(mainKey)) {
                pressedKeys.push(mainKey);
            }
            
            const keyMatch = keys.length === pressedKeys.length && 
                           keys.every(k => pressedKeys.includes(k.toLowerCase()));
            
            if (keyMatch) {
                if (key !== "paste") event.preventDefault();

                if (key === "save") {
                    this._render.emit(key as RenderEventsType, { data: this._render.serialize() })
                    return
                }

                if (key === "delete") {
                    this.deleteNodes()
                    return;
                }

                if (key === "selectAll") {
                    this.selectAllNodes()
                    return;
                }

                if (key === "cut") {
                    this.cutNodes()
                    return;
                }

                if (key === "copy") {
                    this.copyNodes()
                    return;
                }

                if (key === "paste") {
                    return;
                }

                if (key === "duplicate") {
                    this.duplicateNodes()
                    return;
                }

                if (key === "top") {
                    this.topNodes()
                    return;
                }

                if (key === "bottom") {
                    this.bottomNodes()
                    return;
                }

                if (key === "front") {
                    this.frontNodes()
                    return;
                }

                if (key === "back") {
                    this.backNodes()
                    return;
                }

                this._render.emit(key as RenderEventsType, {});
            }
        }
    }

    /**
     * Handles paste events and processes the clipboard data.
     * Detects pasted images and converts them to data URLs or object URLs.
     * @param event - The paste event to handle.
     * @private
     */
    private _pasteContent(event: ClipboardEvent): void {
        event.preventDefault();
        if (!event.clipboardData) return;

        const items = Array.from(event.clipboardData.items);
        
        for (const item of items) {
            if (item.type.startsWith('image/')) {
                const file = item.getAsFile();
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        const dataUrl = e.target?.result as string;
                        this._render.creator.Image({
                            src: dataUrl,
                            position: new Vector(this._render.mousePosition().x, this._render.mousePosition().y),
                        });
                    };
                    reader.readAsDataURL(file);
                    
                    return;
                }
            }
        }

        const textData = event.clipboardData.getData('text/plain');
        if (textData) {
            const imageUrlPattern = /^https?:\/\/.*\.(jpg|jpeg|png|gif|bmp|webp|svg)(\?.*)?$/i;
            if (imageUrlPattern.test(textData.trim())) {
                this._render.creator.Image({
                    src: textData.trim(),
                    position: new Vector(this._render.mousePosition().x, this._render.mousePosition().y),
                });
                return;
            }
        }

        if (textData) {
            try {
                const parsedData = JSON.parse(textData);
                if (Array.isArray(parsedData)) {
                    this.pasteNodes(parsedData);
                }
            } catch(error) {
                console.log(error);
            }
        }
    }

    /**
     * Sets up keyboard shortcuts and event listeners.
     * Processes string-based key combinations (e.g., "ctrl+z") into arrays (e.g., ["ctrl", "z"]).
     * @private
     */
    private setup(): void {
        Object.entries(this._config.keywords ?? {}).forEach(([key, value]) => {
            this._keywords[key] = value.split("+");
        });
        
        document.removeEventListener("keydown", this._boundHandleKeyDown);
        window.removeEventListener("paste", this._boundPasteContent);
        
        document.addEventListener("keydown", this._boundHandleKeyDown);
        window.addEventListener("paste", this._boundPasteContent);
    }

    /**
     * Updates the configuration with new settings.
     * @param config - New configuration options to apply.
     * @returns The RenderConfiguration instance for method chaining.
     */
    public load(config: RenderConfigurationProps): RenderConfiguration {
        this._config = config
        this.setup()
        return this
    }

    /**
     * Gets the current configuration options.
     * @returns The current configuration settings.
     */
    public get config(): RenderConfigurationProps {
        return this._config
    }

    /**
     * Deletes the nodes of the currently selected shapes.
     * @returns void
     */
    public deleteNodes(): void {
        const nodes = Array.from(this._render.transformer.childs.values());
        nodes.forEach(node => node.destroy());
        this._render.emit("delete", { data: nodes });
        this._render.autoSave();
    }

    /**
     * Duplicates the nodes of the currently selected shapes.
     * @returns void
     */
    public duplicateNodes(): void {
        const nodes = Array.from(this._render.transformer.childs.values());
        nodes.forEach(node => {
            const clone = node.clone();
            let width = 0;
            if (node instanceof Rect) {
                width = node.width;
            } else if (node instanceof Circle) {
                width = node.radius * 2;
            } else if (node instanceof Text) {
                width = node.width;
            } else if (node instanceof Image) {
                width = node.width;
            }
            clone.position = new Vector(node.position.x + width, node.position.y);
            this._render.manager.addChild(clone);
        });
        this._render.autoSave();
    }

    /**
     * Selects all the nodes on the canvas.
     * @returns void
     */
    public selectAllNodes(): void {
        this._render.transformer.selectAll();
        const nodes = Array.from(this._render.transformer.childs.values());
        this._render.emit("selectAll", { data: nodes });
    }
    
    /**
     * Cuts the nodes of the currently selected shapes.
     * @returns void
     */
    public cutNodes(): void {
        const serializedNodes = Array.from(this._render.transformer.childs.values()).map((child: Shape) => {
            const rawData: ShapeRawData = child._rawData() as ShapeRawData;
            if (rawData.type === "rect") {
                (rawData as RectRawData).width;
            } else if (rawData.type === "circle") {
                (rawData as CircleRawData).radius * 2;
            } else if (rawData.type === "text") {
                (rawData as TextRawData).width;
            } else if (rawData.type === "image") {
                (rawData as ImageRawData).width;
            }
            
            child.destroy();
            return rawData;
        });
        navigator.clipboard.writeText(JSON.stringify(serializedNodes))
        .then(() => {
            this._render.emit("cut", { data: serializedNodes });
        })
        .catch(() => {});
        this._render.autoSave();
    }

    /**
     * Copies the nodes of the currently selected shapes to the clipboard.
     * Each node is serialized and assigned a new unique ID.
     * @returns void
     */
    public copyNodes(): void {
        const serializedNodes = Array.from(this._render.transformer.childs.values()).map((child: Shape) => {
            const rawData: ShapeRawData = child._rawData() as ShapeRawData;
            let width = 0;
            if (rawData.type === "rect") {
                width = (rawData as RectRawData).width;
            } else if (rawData.type === "circle") {
                width = (rawData as CircleRawData).radius * 2;
            } else if (rawData.type === "text") {
                width = (rawData as TextRawData).width;
            } else if (rawData.type === "image") {
                width = (rawData as ImageRawData).width;
            }
            
            rawData.position = new Vector(rawData.position.x + width, rawData.position.y);
            return rawData;
        });
        navigator.clipboard.writeText(JSON.stringify(serializedNodes))
        .then(() => {
            this._render.emit("copy", { data: serializedNodes });
        })
        .catch(() => {});
    }

    /**
     * Pastes the nodes from the clipboard into the canvas.
     * Each node is deserialized and added to the canvas.
     * @returns void
     */
    public pasteNodes(data: ShapeRawData[]): void {
        try {
            const shapes: Shape[] = [];
            data.forEach((child: ShapeRawData) => {
                child.id = uuidv4();
                if (child.type === "rect") {
                    shapes.push(Rect._fromRawData(child as RectRawData, this._render));
                } else if (child.type === "circle") {
                    shapes.push(Circle._fromRawData(child as CircleRawData, this._render));
                } else if (child.type === "text") {
                    shapes.push(Text._fromRawData(child as TextRawData, this._render));
                } else if (child.type === "image") {
                    shapes.push(Image._fromRawData(child as ImageRawData, this._render));
                }
            });

            this._render.emit("paste", { data: shapes });
        } catch (error) {
            console.log(error);
        }

        this._render.autoSave();
    }

    /**
     * Raises the selected nodes to the top of the canvas.
     * @returns void
     */
    public topNodes(): void {
        const nodes = [...this._render.transformer.childs.values()].map((child: Shape) => {
            child.setTop();
            return child;
        });

        this._render.emit("top", { data: nodes });
    }

    /**
     * Raises the selected nodes to the bottom of the canvas.
     * @returns void
     */
    public bottomNodes(): void {
        const nodes = [...this._render.transformer.childs.values()].map((child: Shape) => {
            child.setBottom();
            return child;
        });

        this._render.emit("bottom", { data: nodes });
    }

    /**
     * Raises the selected nodes to the front of the canvas.
     * @returns void
     */
    public frontNodes(): void {
        const nodes = [...this._render.transformer.childs.values()].map((child: Shape) => {
            child.setFront();
            return child;
        });

        this._render.emit("front", { data: nodes });
    }

    /**
     * Raises the selected nodes to the back of the canvas.
     * @returns void
     */
    public backNodes(): void {
        const nodes = [...this._render.transformer.childs.values()].map((child: Shape) => {
            child.setBack();
            return child;
        });

        this._render.emit("back", { data: nodes });
    }

    /**
     * Returns the default keyboard shortcuts for common canvas operations.
     * @returns Default key mappings for standard operations.
     */
    public static defaultKeyWords(): Keys {
        return {
            undo: "ctrl+z",
            redo: "ctrl+y",
            save: "ctrl+s",
            copy: "ctrl+c",
            cut: "ctrl+x",
            paste: "ctrl+v",
            duplicate: "ctrl+d",
            delete: "delete",
            selectAll: "ctrl+a",
            top: "ctrl+i",
            bottom: "ctrl+k",
            front: "ctrl+shift+i",
            back: "ctrl+shift+k",
        }
    }
}