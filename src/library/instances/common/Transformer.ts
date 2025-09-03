import { Render } from "../../Render";
import { Shape } from "../Shape";

export class Transformer {
    public _render: Render;

    public _childs: Map<string, Shape> = new Map();
    
    public constructor(render: Render) {
        this._render = render;
    }

    public add(child: Shape): void {
        this._childs.set(child.id, child);
    }

    public remove(child: Shape): void {
        this._childs.delete(child.id);
    }

    public clear(): void {
        this._childs.clear();
    }

    public get childs(): Map<string, Shape> {
        return this._childs;
    }
}