import { Render } from "../Render";
import type { RenderEventsType } from "../types/RenderProvider";

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
    delete: string,
    selectAll: string,
    top: string,
    bottom: string,
    front: string,
    back: string,
}

export type AutoSaveMethods = "cookies" | "localstorage" | null

/**
 * Configuration properties for the render system.
 * Controls which features are enabled and defines keyboard shortcuts.
 */
export interface RenderConfigurationProps {
    history?: boolean,
    pan?: boolean,
    zoom?: boolean,
    select?: boolean,
    resize?: boolean,
    snap?: boolean,
    transform?: boolean,
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
            select: false,
            resize: false,
            snap: false,
            transform: false,
            save: null,
            keywords: RenderConfiguration.defaultKeyWords()
        }

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
                event.preventDefault();
                this._render.emit(key as RenderEventsType, {});
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
        document.removeEventListener("keydown", this._handleKeyDown);
        document.addEventListener("keydown", this._handleKeyDown);
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
            delete: "delete",
            selectAll: "ctrl+a",
            top: "ctrl+i",
            bottom: "ctrl+k",
            front: "ctrl+shift+i",
            back: "ctrl+shift+k",
        }
    }
}