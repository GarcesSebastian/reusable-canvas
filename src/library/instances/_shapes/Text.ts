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
    color: string;
    backgroundColor: string;
    borderWidth: number;
    borderColor: string;
    padding: { top: number; right: number; bottom: number; left: number };
}

export class Text extends Shape {
    private _ctx: CanvasRenderingContext2D;

    public value: string;
    public fontSize: number;
    public fontFamily: string;
    public fontWeight: string;
    public fontStyle: string;
    public textAlign: CanvasTextAlign;
    public color: string;
    public backgroundColor: string;
    public borderWidth: number;
    public borderColor: string;
    public padding: { top: number; right: number; bottom: number; left: number };

    private _width: number;
    private _height: number;

    private _ascent: number;
    private _descent: number;

    private _editing: boolean = false;
    private _textarea: HTMLTextAreaElement | null = null;
    
    public constructor(DataText: IText, render: Render, id?: string) {
        super(DataText, render, id);

        this.value = DataText.text;
        this.fontSize = DataText.fontSize;
        this.fontFamily = DataText.fontFamily;
        this.fontWeight = DataText.fontWeight;
        this.fontStyle = DataText.fontStyle;
        this.textAlign = DataText.textAlign;
        this.color = DataText.color;
        this.backgroundColor = DataText.backgroundColor;
        this.borderWidth = DataText.borderWidth;
        this.borderColor = DataText.borderColor;
        this.padding = DataText.padding;

        this._width = 0;
        this._height = 0;

        this._ascent = 0;
        this._descent = 0;

        this._ctx = this._render.ctx;
        this._setup();
    }

    private _setup(): void {
        this._calculateTextMetrics();
        this._events();
    }

    private _events(): void {
        this.on("click", () => {
            this._editing = !this._editing;
            this._setupEditor();
        })
    }

    private _setupEditor(): void {
        if (this._textarea) return;

        const textarea = document.createElement("textarea");
        document.body.appendChild(textarea);
        textarea.focus();

        textarea.addEventListener('input', (e) => {
            this.value = (e.target as HTMLTextAreaElement).value;
            this._calculateTextMetrics();
            this._resizeTextarea();
        });

        textarea.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this._editing = false;
                this._disolveEditor();
                e.preventDefault();
            } else if (e.key === 'Enter' && e.ctrlKey) {
                this._editing = false;
                this._disolveEditor();
                e.preventDefault();
            }
        });

        textarea.addEventListener('blur', () => {
            this._editing = false;
            this._disolveEditor();
        });

        this._textarea = textarea;
        this._updateEditor();
    }

    private _updateEditor(): void {
        if (!this._textarea) return;
        const position = this._render.toWorldCoordinates(this.position);
        this._textarea.value = this.value;
        this._textarea.style.position = "absolute";
        this._textarea.style.left = `${position.x - this.padding.left}px`;
        this._textarea.style.top = `${position.y - this.padding.top - this._ascent}px`;
        this._textarea.style.width = `${this.width + this.padding.left + this.padding.right + this.borderWidth}px`;
        this._textarea.style.zIndex = "1000";
        this._textarea.style.border = `${this.borderWidth}px solid ${this.borderColor}`;
        this._textarea.style.outline = "none";
        this._textarea.style.resize = "none";
        this._textarea.style.fontSize = `${this.fontSize}px`;
        this._textarea.style.fontFamily = this.fontFamily;
        this._textarea.style.fontWeight = this.fontWeight;
        this._textarea.style.fontStyle = this.fontStyle;
        this._textarea.style.color = this.color;
        this._textarea.style.backgroundColor = "green";
        this._textarea.style.padding = `${this.padding.top / 2}px ${this.padding.left / 2}px`;
        this._textarea.style.boxSizing = "border-box";
        this._textarea.style.overflow = "hidden";
        this._textarea.style.scrollbarWidth = "none";
        this._textarea.style.textAlign = this.textAlign;
        this._textarea.style.lineHeight = "0.8";
        this._textarea.style.whiteSpace = "pre-wrap";
        this._textarea.style.margin = "0";
        this._textarea.style.verticalAlign = "top";
        this._resizeTextarea();
    }

    private _resizeTextarea(): void {
        if (!this._textarea) return;
        this._textarea.style.height = "auto";
        const lines = this.value.split('\n');
        const lineCount = Math.max(1, lines.length);
        const lineHeight = this.fontSize;
        const contentHeight = lineCount * lineHeight;
        
        const totalHeight = contentHeight + this.padding.top + this.padding.bottom / 2 + this.borderWidth;
        
        this._textarea.style.height = `${totalHeight}px`;
    }

    private _disolveEditor(): void {
        if (!this._textarea) return;
        this._textarea.remove();
        this._textarea = null;
    }

    private _setupFont(): void {
        this._ctx.font = `${this.fontStyle} ${this.fontWeight} ${this.fontSize}px ${this.fontFamily}`;
        this._ctx.textAlign = this.textAlign;
        this._ctx.textBaseline = "alphabetic";
    }

    private _calculateTextMetrics(): void {
        this._ctx.save();
        this._setupFont();

        const lines = this.value.split("\n");
        this._ascent = 0;
        this._descent = 0;
        this._width = 0;
        this._height = 0;

        lines.forEach((line: string) => {
            const metrics = this._ctx.measureText(line);
            const ascent = metrics.actualBoundingBoxAscent;
            const descent = metrics.actualBoundingBoxDescent;
            const width = metrics.width;
            const height = ascent + descent;

            this._ascent = Math.max(this._ascent, ascent);
            this._descent = Math.max(this._descent, descent);
            this._width = Math.max(this._width, width);
            this._height += height;
        });

        this._ctx.restore();
    }

    private _getTextOffsetX(): number {
        if (this.textAlign === "center") return -this._width / 2;
        if (this.textAlign === "right" || this.textAlign === "end") return -this._width;
        return 0;
    }

    private _getTextOffsetY(): number {
        return -this._ascent;
    }

    private _drawBackground(): void {
        const offsetX = this._getTextOffsetX();
        const rectX = offsetX - this.padding.left;
        const rectY = -this._ascent - this.padding.top;
        const rectW = this._width + this.padding.left + this.padding.right;
        const rectH = this._height + this.padding.top + this.padding.bottom;
    
        this._ctx.fillStyle = this.backgroundColor;
        this._ctx.fillRect(rectX, rectY, rectW, rectH);
    
        if (this.borderWidth > 0) {
            this._ctx.lineWidth = this.borderWidth;
            this._ctx.strokeStyle = this.borderColor;
            this._ctx.strokeRect(rectX, rectY, rectW, rectH);
        }
    }

    private _drawTextLines(): void {
        this._ctx.fillStyle = this.color;
        const lines = this.value.split("\n");
        
        lines.forEach((line: string, index: number) => {
            const metrics = this._ctx.measureText(line);
            const height = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
            this._ctx.fillText(line, 0, height * index);
        });
    }

    public get width(): number {
        return this._width;
    }

    public get height(): number {
        return this._height;
    }

    public get ascent(): number {
        return this._ascent;
    }

    public get descent(): number {
        return this._descent;
    }

    public _isEditing(): boolean {
        return this._editing;
    }

    public _isClicked(): boolean {
        const mouseVector = this._render.worldPosition();
        const camera = this._render.currentCamera;
        const current = this.position.sub(camera.offset);

        const offsetX = this._getTextOffsetX();
        const offsetY = this._getTextOffsetY();

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
        if (!this.visible) return;
        this._calculateTextMetrics();
        
        this._ctx.save();
        this._ctx.translate(
            this.position.x - this._render.currentCamera.offset.x,
            this.position.y - this._render.currentCamera.offset.y
        );
        this._ctx.rotate(this.rotation);
    
        this._setupFont();
        this._drawBackground();
        this._drawTextLines();
    
        this._ctx.restore();
    }

    public update() {
        this.draw();
        this._updateEditor();
    }

    public clone(): Shape {
        const payload: IText = {
            text: this.value,
            fontSize: this.fontSize,
            fontFamily: this.fontFamily,
            fontWeight: this.fontWeight,
            fontStyle: this.fontStyle,
            textAlign: this.textAlign,
            color: this.color,
            position: this.position,
            zIndex: this.zIndex,
            rotation: this.rotation,
            dragging: this.dragging,
            visible: this.visible,
            backgroundColor: this.backgroundColor,
            borderWidth: this.borderWidth,
            borderColor: this.borderColor,
            padding: this.padding,
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
            color: this.color,
            backgroundColor: this.backgroundColor,
            borderWidth: this.borderWidth,
            borderColor: this.borderColor,
            padding: this.padding,
        }
    }
}