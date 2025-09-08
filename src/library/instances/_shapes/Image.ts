import { IShape, Shape } from "../Shape";
import { Render } from "../../Render";
import { ImageRawData } from "../../types/Raw";
import { Vector } from "../common/Vector";

export interface IImage extends IShape {
    src: string;
    width?: number;
    height?: number;
    borderWidth?: number;
    borderColor?: string;
    cornerRadius?: number;
}

export class Image extends Shape {
    /** Canvas rendering context for drawing operations. */
    private _ctx: CanvasRenderingContext2D;

    /** Source URL of the image. */
    public src: string;
    /** Width of the image in pixels. */
    public width: number;
    /** Height of the image in pixels. */
    public height: number;
    /** Border width of the image. */
    public borderWidth: number;
    /** Border color of the image. */
    public borderColor: string;
    /** Corner radius for rounded corners. */
    public cornerRadius: number;

    /** Whether the image is currently loading. */
    private _isLoading: boolean = true;
    /** Whether the dimensions of the image are defined. */
    private _dimensionDefined: boolean = true;
    /** The HTML image element used for rendering. */
    private _image: HTMLImageElement;
    /** Original width of the image in pixels. */
    private _originalWidth: number | undefined;
    /** Original height of the image in pixels. */
    private _originalHeight: number | undefined;
    /** Whether the image has failed to load. */
    private _error: boolean = false;

    /** Rotation angle of the loading animation in radians. */
    private _rotationLoader: number = 0;
    
    public constructor(props: IImage, render: Render, id?: string) {
        super(props, render, id);

        this._ctx = render.ctx;
        this.src = props.src;
        this.width = props.width ?? 100;
        this.height = props.height ?? 100;
        this.borderWidth = props.borderWidth ?? 0;
        this.borderColor = props.borderColor ?? "black";
        this.cornerRadius = props.cornerRadius ?? 0;

        if (!props.width || !props.height) this._dimensionDefined = false;

        this._image = new globalThis.Image();
        this._setup();
    }

    /**
     * @internal
     * Sets up the image by loading it and setting up event listeners.
     */
    private _setup(): void {
        this._image.crossOrigin = "anonymous";
        this._image.onload = () => {
            this._originalWidth = this._image.naturalWidth;
            this._originalHeight = this._image.naturalHeight;

            if (!this._dimensionDefined) {
                this.width = this._originalWidth;
                this.height = this._originalHeight;
            }

            this._isLoading = false;
        };
        
        this._image.onerror = () => {
            console.error(`Failed to load image: ${this.src}`);
            this._error = true;
        };

        this._image.src = this.src;
    }

    /**
     * Draws the loading placeholder with pulsating effect.
     */
    private _drawLoadingPlaceholder(): void {
        this._rotationLoader += 0.1;
        this._ctx.save();
        
        const offset = this._render.getOffset();

        const alpha = 0.5 + Math.sin(Date.now() * 0.005) * 0.2;
        this._ctx.translate(this.position.x - offset.x, this.position.y - offset.y);
        this._ctx.rotate(this.rotation);
        
        this._ctx.fillStyle = `rgba(200, 200, 200, ${alpha})`;
        this._ctx.fillRect(0, 0, this.width, this.height);
        
        this._ctx.strokeStyle = `rgba(150, 150, 150, ${alpha * 0.5})`;
        this._ctx.lineWidth = 2;
        this._ctx.strokeRect(0, 0, this.width, this.height);
        
        this._drawLoadingIcon(alpha);
        
        this._ctx.restore();
    }

    /**
     * Draws a simple loading icon in the center of the placeholder.
     */
    private _drawLoadingIcon(alpha: number): void {
        const centerX = this.width / 2;
        const centerY = this.height / 2;
        const radius = Math.min(this.width, this.height) * 0.1;
        
        this._ctx.save();
        this._ctx.translate(centerX, centerY);
        this._ctx.rotate(this._rotationLoader);
        this._ctx.strokeStyle = `rgba(100, 100, 100, ${alpha})`;
        this._ctx.lineWidth = 3;
        this._ctx.beginPath();
        this._ctx.arc(0, 0, radius, 0, Math.PI * 1.5);
        this._ctx.stroke();
        this._ctx.restore();
    }

    /**
     * Draws a simple error placeholder in the center of the image.
     */
    private _drawErrorPlaceholder(): void {
        this._ctx.save();
        this._ctx.translate(this.position.x, this.position.y);
        this._ctx.rotate(this.rotation);

        this._ctx.beginPath();
        this._ctx.moveTo(0, 0);
        this._ctx.lineTo(this.width, this.height);
        this._ctx.moveTo(this.width, 0);
        this._ctx.lineTo(0, this.height);
        this._ctx.strokeStyle = "red";
        this._ctx.lineWidth = 2;
        this._ctx.stroke();

        this._ctx.rect(0, 0, this.width, this.height);
        this._ctx.fillStyle = "rgba(255, 0, 0, 0.5)";
        this._ctx.fill();

        this._ctx.font = "48px Microsoft YaHei";
        this._ctx.textAlign = "center";
        this._ctx.textBaseline = "middle";
        this._ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
        this._ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
        this._ctx.lineWidth = 2;
        this._ctx.strokeText("ERROR", this.width / 2, this.height / 2);
        this._ctx.fillText("ERROR", this.width / 2, this.height / 2);
        this._ctx.restore();
    }

    /**
     * @internal
     * Checks whether this image intersects with a specified rectangular boundary.
     */
    public _isShapeInBoundary(boundaryX: number, boundaryY: number, boundaryWidth: number, boundaryHeight: number): boolean {
        const current = this.position.sub(this._render.getOffset());
        
        if (this.rotation === 0) {
            return !(current.x + this.width < boundaryX || 
                current.x > boundaryX + boundaryWidth ||
                current.y + this.height < boundaryY || 
                current.y > boundaryY + boundaryHeight);
        }
        
        const corners = [
            { x: 0, y: 0 },
            { x: this.width, y: 0 },
            { x: this.width, y: this.height },
            { x: 0, y: this.height }
        ];
        
        const cos = Math.cos(this.rotation);
        const sin = Math.sin(this.rotation);
        
        for (const corner of corners) {
            const rotatedX = current.x + corner.x * cos - corner.y * sin;
            const rotatedY = current.y + corner.x * sin + corner.y * cos;
            
            if (rotatedX >= boundaryX && rotatedX <= boundaryX + boundaryWidth &&
                rotatedY >= boundaryY && rotatedY <= boundaryY + boundaryHeight) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * @internal
     * Determines if a point (usually the mouse cursor) is inside the image.
     */
    public _isClicked() : boolean {
        const mouseVector = this._render.worldPosition();
        const current = this.position.sub(this._render.getOffset());
        
        if (this.rotation === 0) {
            return mouseVector.x >= current.x && 
                   mouseVector.x <= current.x + this.width &&
                   mouseVector.y >= current.y && 
                   mouseVector.y <= current.y + this.height;
        }
        
        const dx = mouseVector.x - current.x;
        const dy = mouseVector.y - current.y;
        
        const cos = Math.cos(-this.rotation);
        const sin = Math.sin(-this.rotation);
        
        const localX = dx * cos - dy * sin;
        const localY = dx * sin + dy * cos;
        
        return localX >= 0 && 
               localX <= this.width &&
               localY >= 0 && 
               localY <= this.height;
    }

    /**
     * Draws the image on the canvas with its current properties.
     */
    public draw(): void {
        if (!this.visible) return;
    
        if (this._isLoading && !this._error) {
            this._drawLoadingPlaceholder();
            return;
        }

        if (this._error) {
            this._drawErrorPlaceholder();
            return;
        }
    
        this._ctx.save();
    
        const offset = this._render.getOffset();
        this._ctx.translate(this.position.x - offset.x, this.position.y - offset.y);
        this._ctx.rotate(this.rotation);
    
        const radius = this.cornerRadius ?? 0;
        const w = this.width;
        const h = this.height;
    
        if (radius > 0) {
            this._ctx.beginPath();
            this._ctx.moveTo(radius, 0);
            this._ctx.lineTo(w - radius, 0);
            this._ctx.quadraticCurveTo(w, 0, w, radius);
            this._ctx.lineTo(w, h - radius);
            this._ctx.quadraticCurveTo(w, h, w - radius, h);
            this._ctx.lineTo(radius, h);
            this._ctx.quadraticCurveTo(0, h, 0, h - radius);
            this._ctx.lineTo(0, radius);
            this._ctx.quadraticCurveTo(0, 0, radius, 0);
            this._ctx.closePath();
    
            this._ctx.clip();
    
            this._ctx.drawImage(this._image, 0, 0, w, h);
    
            if (this.borderWidth > 0) {
                this._ctx.strokeStyle = this.borderColor;
                this._ctx.lineWidth = this.borderWidth;
                this._ctx.stroke();
            }
        } else {
            this._ctx.drawImage(this._image, 0, 0, w, h);
    
            if (this.borderWidth > 0) {
                this._ctx.strokeStyle = this.borderColor;
                this._ctx.lineWidth = this.borderWidth;
                this._ctx.strokeRect(0, 0, w, h);
            }
        }
    
        this._ctx.restore();
    }

    /**
     * Updates the image's state and re-renders it on the canvas.
     */
    public update(): void {
        this.draw();
    }

    /**
     * Checks if the image is currently loading.
     * @returns True if the image is still loading
     */
    public get isLoading(): boolean {
        return this._isLoading;
    }

    /**
     * Creates a deep copy of this image.
     */
    public clone(): Image {
        return this._render.creator.Image({
            ...this,
            position: this.position.clone(),
        });
    }

    /**
     * @internal
     * Returns the raw data of the image.
     */
    public _rawData(): ImageRawData {
        return {
            id: this.id,
            type: "image",
            position: this.position,
            rotation: this.rotation,
            zIndex: this.zIndex,
            dragging: this.dragging,
            visible: this.visible,
            width: this.width ?? 0,
            height: this.height ?? 0,
            src: this.src,
            borderWidth: this.borderWidth,
            borderColor: this.borderColor,
            cornerRadius: this.cornerRadius,
        };
    }

    /**
     * @internal
     * Creates a new image instance from raw data.
     */
    public static _fromRawData(data: ImageRawData, render: Render): Image {
        const image = new Image(data, render, data.id);
        image.position = new Vector(data.position.x, data.position.y);
        image.rotation = data.rotation;
        image.zIndex = data.zIndex;
        image.dragging = data.dragging;
        image.visible = data.visible;
        image.width = data.width;
        image.height = data.height;
        image.src = data.src;
        image.borderWidth = data.borderWidth;
        image.borderColor = data.borderColor;
        image.cornerRadius = data.cornerRadius;

        render.emit("create", { shape: image });
        
        return image;
    }
}