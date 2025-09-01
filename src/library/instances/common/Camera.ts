import { Render } from "../../Render";
import { Vector } from "../common/Vector";

export class Camera {
    private _render: Render;   
    
    public offset: Vector;
    public maxOffset: Vector;

    private _binded: boolean = false;
    private _speed: number = 0.1;

    public constructor(render: Render) {
        this.offset = Vector.zero;
        this.maxOffset = Vector.zero;
        this._render = render;
    }

    public update(): void {
        if (this._binded) {
            this.offset.x = Render.lerp(this.offset.x, this.maxOffset.x, this._speed);
            this.offset.y = Render.lerp(this.offset.y, this.maxOffset.y, this._speed);
            return;
        }
    }

    public bind(pointer: Vector): void {
        this.maxOffset.x = pointer.x - this._render.canvas.width / 2;
        this.maxOffset.y = pointer.y - this._render.canvas.height / 2;
        this._binded = true;
    }

    public unbind(): void {
        this._binded = false;
    }
}