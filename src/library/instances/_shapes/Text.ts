import { Render } from "../../Render";
import { TextRawData } from "../../types/Raw";
import { Shape, IShape } from "../Shape";

export interface IText extends IShape {
    text: string;
    fontSize: number;
    fontFamily: string;
    fontWeight: string;
    fontStyle: string;
    textAlign: CanvasTextAlign;
    textBaseline: CanvasTextBaseline;
    color: string;
}

export class Text extends Shape {
    private _ctx: CanvasRenderingContext2D;

    public value: string;
    public fontSize: number;
    public fontFamily: string;
    public fontWeight: string;
    public fontStyle: string;
    public textAlign: CanvasTextAlign;
    public textBaseline: CanvasTextBaseline;
    public color: string;

    private _width: number;
    private _height: number;
    
    public constructor(DataText: IText, render: Render, id?: string) {
        super(DataText, render, id);

        this.value = DataText.text;
        this.fontSize = DataText.fontSize;
        this.fontFamily = DataText.fontFamily;
        this.fontWeight = DataText.fontWeight;
        this.fontStyle = DataText.fontStyle;
        this.textAlign = DataText.textAlign;
        this.textBaseline = DataText.textBaseline ?? "alphabetic";
        this.color = DataText.color;

        this._ctx = this._render.ctx;

        this._ctx.save();
        this._ctx.font = `${this.fontStyle} ${this.fontWeight} ${this.fontSize}px ${this.fontFamily}`;
        this._ctx.fillStyle = this.color;
        this._ctx.textAlign = this.textAlign;
        this._ctx.textBaseline = this.textBaseline;

        const metrics = this._ctx.measureText(this.value);
        this._width = metrics.width;
        this._height = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;

        this._ctx.restore();
    }

    public _isClicked(): boolean {
        const mouseVector = this._render.worldPosition();
        const camera = this._render.currentCamera;
        const current = this.position.sub(camera.offset);

        let offsetX = 0;
        let offsetY = 0;

        if (this.textAlign === "center") {
            offsetX = -this._width / 2;
        } else if (this.textAlign === "right" || this.textAlign === "end") {
            offsetX = -this._width;
        }

        this._ctx.save();
        this._ctx.font = `${this.fontStyle} ${this.fontWeight} ${this.fontSize}px ${this.fontFamily}`;
        const metrics = this._ctx.measureText(this.value);
        const ascent = metrics.actualBoundingBoxAscent || metrics.fontBoundingBoxAscent || this.fontSize * 0.8;
        this._ctx.restore();

        if (this.textBaseline === "top") {
            offsetY = 0;
        } else if (this.textBaseline === "middle") {
            offsetY = -ascent / 2;
        } else if (this.textBaseline === "bottom") {
            offsetY = -ascent;
        } else {
            offsetY = -ascent;
        }

        if (this.rotation === 0) {
            const boundingX = current.x + offsetX;
            const boundingY = current.y + offsetY;
            
            return mouseVector.x >= boundingX && 
                   mouseVector.x <= boundingX + this._width &&
                   mouseVector.y >= boundingY && 
                   mouseVector.y <= boundingY + this._height;
        }
        
        const dx = mouseVector.x - current.x;
        const dy = mouseVector.y - current.y;
        
        const cos = Math.cos(-this.rotation);
        const sin = Math.sin(-this.rotation);
        
        const localX = dx * cos - dy * sin;
        const localY = dx * sin + dy * cos;
        
        return localX >= offsetX && 
               localX <= offsetX + this._width &&
               localY >= offsetY && 
               localY <= offsetY + this._height;
    }

    public _isShapeInBoundary(_boundaryX: number, _boundaryY: number, _boundaryWidth: number, _boundaryHeight: number): boolean {
        return false;
    }

    public draw(): void {
        this._ctx.save();
        this._ctx.translate(this.position.x - this._render.currentCamera.offset.x, this.position.y - this._render.currentCamera.offset.y);
        this._ctx.rotate(this.rotation);
    
        this._ctx.font = `${this.fontStyle} ${this.fontWeight} ${this.fontSize}px ${this.fontFamily}`;
        this._ctx.fillStyle = this.color;
        this._ctx.textAlign = this.textAlign;
        this._ctx.textBaseline = this.textBaseline;

        const metrics = this._ctx.measureText(this.value);
        const ascent = metrics.actualBoundingBoxAscent;
        const descent = metrics.actualBoundingBoxDescent;
        this._width = metrics.width;
        this._height = ascent + descent;

        let offsetX = 0;
        if (this.textAlign === "center") offsetX = -this._width / 2;
        else if (this.textAlign === "right" || this.textAlign === "end") offsetX = -this._width;
    
        this._ctx.fillText(this.value, 0, 0);
    
        this._ctx.beginPath();
        this._ctx.rect(offsetX, -ascent, this._width, this._height);
        this._ctx.strokeStyle = "red";
        this._ctx.stroke();
        this._ctx.closePath();
    
        this._ctx.restore();
    }

    public update() {
        this.draw();
    }

    public clone(): Shape {
        const payload: IText = {
            text: this.value,
            fontSize: this.fontSize,
            fontFamily: this.fontFamily,
            fontWeight: this.fontWeight,
            fontStyle: this.fontStyle,
            textAlign: this.textAlign,
            textBaseline: this.textBaseline,
            color: this.color,
            position: this.position,
            zIndex: this.zIndex,
            rotation: this.rotation,
            dragging: this.dragging,
            visible: this.visible,
        }

        return new Text(payload, this._render, this.id);
    }

    public _rawData(): TextRawData {
        return {
            id: this.id,
            type: "text",
            position: this.position,
            rotation: this.rotation,
            zIndex: this.zIndex,
            dragging: this.dragging,
            visible: this.visible,
            value: this.value,
            fontSize: this.fontSize,
            fontFamily: this.fontFamily,
            fontWeight: this.fontWeight,
            fontStyle: this.fontStyle,
            textAlign: this.textAlign,
            textBaseline: this.textBaseline,
            color: this.color,
        }
    }
}