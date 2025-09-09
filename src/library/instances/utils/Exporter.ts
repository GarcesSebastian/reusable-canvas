import { Render } from "../../Render";
import { Vector } from "../common/Vector";

/** Supported export formats for canvas output. */
export type ExportFormat = "png" | "jpeg" | "webp" | "json";

/** Quality levels for image exports. */
export type ExportQuality = "low" | "medium" | "high";

export type ExportSide = "top" | "bottom" | "left" | "right";

/** Properties for configuring canvas export operations. */
export interface ExportProps {
    /** The format to export the canvas as. */
    format: ExportFormat;
    /** Quality level for image exports. Defaults to "high" if not specified. */
    quality?: ExportQuality;
    /** Name for the exported file (without extension). */
    name: string;
    /** Optional crop start position (top-left corner of crop area). */
    cutStart?: Vector;
    /** Optional crop end position (bottom-right corner of crop area). */
    cutEnd?: Vector;
}

/**
 * Canvas export utility for generating high-quality image and data exports.
 * Supports multiple formats, quality levels, and optional cropping functionality.
 * 
 * @example
 * ```ts
 * // Basic export
 * const blob = await render.exporter.export({
 *     format: "png",
 *     quality: "high",
 *     name: "my-canvas"
 * });
 * 
 * // Export with cropping
 * const croppedBlob = await render.exporter.export({
 *     format: "jpeg",
 *     quality: "medium",
 *     name: "cropped-canvas",
 *     cutStart: new Vector(100, 100),
 *     cutEnd: new Vector(500, 400)
 * });
 * 
 * // Direct download
 * await render.exporter.download({
 *     format: "png",
 *     name: "my-export"
 * });
 * ```
 */
export class Exporter {
    /** The render instance used for canvas operations. */
    private _render: Render;
    /** The start position of the cut area. */
    private _cutStart: Vector | null = null;
    /** The end position of the cut area. */
    private _cutEnd: Vector | null = null;
    /** Whether the cut area is currently being drawn. */
    private _isCutting: boolean = false;
    /** Whether the export area is hidden. */
    private _isHidden: boolean = false;

    /** Whether the resize area is currently being drawn. */
    private _isResizing: boolean = false;
    /** The side of the resize area. */
    private _resizeSide: ExportSide | null = null;
    /** The minimum distance for the resize area. */
    private _minDistance: number = 25;

    /** The bound resize start event handler. */
    private _onBoundResizeStart: () => void;
    /** The bound resize event handler. */
    private _onBoundResize: () => void;
    /** The bound resize end event handler. */
    private _onBoundResizeEnd: () => void;

    /**
     * Creates a new Exporter instance.
     * @param render - The render instance to export from.
     */
    constructor(render: Render) {
        this._render = render;

        this._onBoundResizeStart = this._onResizeStart.bind(this);
        this._onBoundResize = this._onResize.bind(this);
        this._onBoundResizeEnd = this._onResizeEnd.bind(this);
        
        this._setup();
    }

    /**
     * Sets up the exporter by initializing all necessary components.
     * @private
     */
    private _setup(): void {
        this._events();
    }

    /**
     * Sets up the events for the exporter.
     * @private
     */
    private _events(): void {
        window.addEventListener("mousedown", this._onBoundResizeStart);
        window.addEventListener("mousemove", this._onBoundResize);
        window.addEventListener("mouseup", this._onBoundResizeEnd);
    }

    /**
     * Handles the resize start event.
     * @private
     */
    private _onResizeStart(): void {
        this._resizeSide = this._getSideClicked();
        this._isResizing = false;
        
        if (!this._resizeSide) return;
        this._isResizing = true;
    }

    /**
     * Handles the resize event.
     * @private
     */
    private _onResize(): void {
        const hoveredSide = this._getSideClicked();
        
        if (hoveredSide) {
            this._setCursor(hoveredSide);
        } else {
            this._setCursor(null);
        }

        if (!this._isResizing || !this._resizeSide) return;
        const mouse = this._render.mousePosition();

        if (this._resizeSide === "left") {
            this._cutStart!.x = mouse.x;
        }

        if (this._resizeSide === "right") {
            this._cutEnd!.x = mouse.x;
        }

        if (this._resizeSide === "top") {
            this._cutStart!.y = mouse.y;
        }

        if (this._resizeSide === "bottom") {
            this._cutEnd!.y = mouse.y;
        }
    }

    /**
     * Handles the resize end event.
     * @private
     */
    private _onResizeEnd(): void {
        this._isResizing = false;
        this._resizeSide = null;
    }

    /**
     * Gets the side of the cut area that is being hovered.
     * @returns The side of the cut area that is being hovered or null if no side is hovered.
     * @private
     */
    private _getSideClicked(): ExportSide | null {
        const mouse = this._render.mousePosition();
        if (this._cutStart && mouse.x < this._cutStart.x + this._minDistance && mouse.x > this._cutStart.x - this._minDistance) return "left";
        if (this._cutStart && mouse.y < this._cutStart.y + this._minDistance && mouse.y > this._cutStart.y - this._minDistance) return "top";
        if (this._cutEnd && mouse.x > this._cutEnd.x - this._minDistance && mouse.x < this._cutEnd.x + this._minDistance) return "right";
        if (this._cutEnd && mouse.y > this._cutEnd.y - this._minDistance && mouse.y < this._cutEnd.y + this._minDistance) return "bottom";
        return null;
    }

    /**
     * Sets the cursor style based on the resize side being hovered.
     * @param side - The side being hovered or null to reset cursor.
     * @private
     */
    private _setCursor(side: ExportSide | null): void {
        const canvas = this._render.canvas;
        
        if (!side) {
            canvas.style.cursor = "default";
            return;
        }

        switch (side) {
            case "left":
            case "right":
                canvas.style.cursor = "ew-resize";
                break;
            case "top":
            case "bottom":
                canvas.style.cursor = "ns-resize";
                break;
        }
    }

    /**
     * Gets the scale factor for the specified quality level.
     * Higher quality levels use larger scale factors for better resolution.
     * @param quality - The quality level to get the scale factor for.
     * @returns The scale factor multiplier.
     */
    private _getScaleFactor(quality: ExportQuality): number {
        switch (quality) {
            case "low":
                return 1.5;
            case "medium":
                return 2.5;
            case "high":
                return 4.0;
        }
    }

    /**
     * Draws the cut area on the canvas.
     * @private
     */
    private _drawCut(): void {
        if (this._isHidden) return;
        
        this._render.ctx.save();
        this._render.ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        this._render.ctx.beginPath();
        this._render.ctx.rect(0, 0, this._render.canvas.width, this._render.canvas.height);
        this._render.ctx.rect(this._cutStart!.x, this._cutStart!.y, this._cutEnd!.x - this._cutStart!.x, this._cutEnd!.y - this._cutStart!.y);
        this._render.ctx.strokeStyle = "rgba(255, 255, 255, 1)";
        this._render.ctx.lineWidth = 2;
        this._render.ctx.setLineDash([5, 5]);
        this._render.ctx.stroke();
        this._render.ctx.fill("evenodd");
        this._render.ctx.closePath();
        this._render.ctx.restore();
    }

    /**
     * Gets the MIME type string for the specified export format.
     * @param format - The export format.
     * @returns The corresponding MIME type string.
     */
    private _getFormat(format: ExportFormat): string {
        switch(format) {
            case "png":
                return "image/png";
            case "jpeg":
                return "image/jpeg";
            case "webp":
                return "image/webp";
            default:
                return "image/png";
        }
    }

    /**
     * Exports the canvas data as a JSON blob.
     * @returns A blob containing the serialized canvas data.
     */
    private _exportToJson(): Blob {
        const data = this._render.serialize();
        const jsonString = JSON.stringify(data, null, 2);
        return new Blob([jsonString], { type: "application/json" });
    }

    /**
     * Downloads the exported canvas directly to the user's device.
     * This is a convenience method that combines export and download functionality.
     * @param props - Export configuration including format, quality, name, and optional cropping.
     * @returns A promise that resolves when the download is initiated.
     */
    public async download(props: ExportProps & { scale?: number; dpi?: number; jpegQuality?: number }) {
        const blob = await this.export(props);
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${props.name}.${props.format}`;
        a.click();
        URL.revokeObjectURL(url);
    }

    /**
     * Checks if the export cut process is active.
     * @returns True if the export cut process is active, false otherwise.
     */
    public isCutting(): boolean {
        return this._isCutting;
    }

    /**
     * Checks if the export resize process is active.
     * @returns True if the export resize process is active, false otherwise.
     */
    public isResizing(): boolean {
        return this._isResizing;
    }

    /**
     * Starts the export cut process.
     * @returns void
     */
    public startExportCut(): void {
        const distance = 100;
        this._isCutting = true;
        this._cutStart = new Vector(distance, distance);
        this._cutEnd = new Vector(this._render.canvas.width - distance, this._render.canvas.height - distance);
    }

    /**
     * Ends the export cut process.
     * @returns void
     */
    public endExportCut(): void {
        this._isCutting = false;
        this._isResizing = false;
        this._cutStart = null;
        this._cutEnd = null;
    }

    /**
     * Hides the export cut area.
     * @returns void
     */
    public hideExportCut(): void {
        this._isHidden = true;
    }

    /**
     * Shows the export cut area.
     * @returns void
     */
    public showExportCut(): void {
        this._isHidden = false;
    }

    /**
     * Gets the dimensions of the export cut area.
     * @returns An object containing the start and end positions of the cut area, or null if no cut is active.
     */
    public getDimension(): { start: Vector, end: Vector } | null {
        if (!this._cutStart || !this._cutEnd) return null;

        return {
            start: this._cutStart,
            end: this._cutEnd
        }
    }

    /**
     * Updates the export cut process.
     * @returns void
     */
    public update(): void {
        if (!this._isCutting) return;
        this._drawCut();
    }

    /**
     * Aborts the export cut process.
     * @returns void
     */
    public abort(): void {
        this._isCutting = false;
        this._isResizing = false;
        this._cutStart = null;
        this._cutEnd = null;
    }

    /**
     * Exports the canvas as a blob in the specified format.
     * Supports high-quality scaling and optional cropping functionality.
     * @param props - Export configuration including format, quality, name, and optional cropping.
     * @returns A promise that resolves to a blob containing the exported canvas data.
     */
    public async export(props: ExportProps & { scale?: number; jpegQuality?: number }): Promise<Blob> {
        const { format, quality, cutStart, cutEnd, scale = 1, jpegQuality = 0.95 } = props;

        const target = this._render.snapSmart.getTarget();
        this._render.preExport();
        this._render.snapSmart.unbind();
        this._render.selection._isSelecting = false;
        this._render.selection._startPosition = Vector.zero;
        this._render.selection._endPosition = Vector.zero;
        this._render.selection._width = 0;
        this._render.selection._height = 0;
        this.hideExportCut();
        this._render._render();
        await new Promise(resolve => requestAnimationFrame(resolve));

        try {
            if (format === "json") {
                return this._exportToJson();
            }

            const originalCanvas = this._render.canvas;
            let cropX = 0, cropY = 0, cropWidth = originalCanvas.width, cropHeight = originalCanvas.height;
            if (cutStart && cutEnd) {
                cropX = Math.min(cutStart.x, cutEnd.x);
                cropY = Math.min(cutStart.y, cutEnd.y);
                cropWidth = Math.abs(cutEnd.x - cutStart.x);
                cropHeight = Math.abs(cutEnd.y - cutStart.y);
            }

            const ratio = window.devicePixelRatio || 1;
            const qualityScale = this._getScaleFactor(quality ?? "high");
            const finalScale = scale * qualityScale * ratio;

            const exportCanvas = document.createElement("canvas");
            exportCanvas.width = Math.round(cropWidth * finalScale);
            exportCanvas.height = Math.round(cropHeight * finalScale);
            const ctx = exportCanvas.getContext("2d")!;
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = "high";
            ctx.setTransform(finalScale, 0, 0, finalScale, 0, 0);

            if (format === "jpeg" || format === "webp") {
                ctx.fillStyle = "white";
                ctx.fillRect(0, 0, cropWidth, cropHeight);
            }

            ctx.drawImage(
                originalCanvas,
                cropX, cropY, cropWidth, cropHeight,
                0, 0, cropWidth, cropHeight
            );

            const mime = this._getFormat(format);
            const qualityParam = format === "jpeg" || format === "webp" ? jpegQuality : undefined;
            const blob: Blob | null = await new Promise(resolve =>
                exportCanvas.toBlob(
                    resolve,
                    mime,
                    qualityParam
                )
            );
            if (!blob) throw new Error("Failed to export canvas");
            return blob;
        } finally {
            this._render.postExport();
            this.showExportCut();
            if (target) {
                this._render.snapSmart.bind(target);
            }
        }
    }

}