import { Render } from "../Render";
import type { RenderEventsType } from "../types/RenderProvider";

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

export interface RenderConfigurationProps {
    history?: boolean,
    pan?: boolean,
    zoom?: boolean,
    select?: boolean,
    resize?: boolean,
    transform?: boolean,
    keywords?: Keys   
}

export type RenderKeywords = Record<string, string[]> // -> { [key: string]: string[] } --> { "copy": ["ctrl", "c"] }

export class RenderConfiguration {
    private _render: Render;
    private _config: RenderConfigurationProps
    private _keywords: RenderKeywords = {};

    public constructor(render: Render, config?: RenderConfigurationProps) {
        this._render = render;
        this._config = config || {
            history: false,
            pan: false,
            zoom: false,
            select: false,
            resize: false,
            transform: false,
            keywords: RenderConfiguration.defaultKeyWords()
        }

        this.setup();
    }

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

    private setup(): void {
        Object.entries(this._config.keywords ?? {}).forEach(([key, value]) => {
            this._keywords[key] = value.split("+");
        });
        document.removeEventListener("keydown", this._handleKeyDown);
        document.addEventListener("keydown", this._handleKeyDown);
    }

    public load(config: RenderConfigurationProps): RenderConfiguration {
        this._config = config
        this.setup()
        return this
    }

    public get config(): RenderConfigurationProps {
        return this._config
    }

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