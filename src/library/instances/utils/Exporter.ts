import { Render } from "../../Render";
import { Vector } from "../common/Vector";

/** Supported export formats for canvas output. */
export type ExportFormat = "png" | "jpeg" | "webp" | "json";

/** Quality levels for image exports. */
export type ExportQuality = "low" | "medium" | "high";

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

    /**
     * Creates a new Exporter instance.
     * @param render - The render instance to export from.
     */
    constructor(render: Render) {
        this._render = render;
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
                return 4.0; // 4x resolution for ultra-high quality
        }
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
    public async download(props: ExportProps): Promise<void> {
        const blob = await this.export(props);
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${props.name}.${props.format}`;
        a.click();
        URL.revokeObjectURL(url);
    }

    /**
     * Exports the canvas as a blob in the specified format.
     * Supports high-quality scaling and optional cropping functionality.
     * @param props - Export configuration including format, quality, name, and optional cropping.
     * @returns A promise that resolves to a blob containing the exported canvas data.
     */
    public async export(props: ExportProps): Promise<Blob> {
        const { format, quality, cutStart, cutEnd } = props;
        
        const target = this._render.snapSmart.getTarget();
        this._render.preExport();
        this._render.snapSmart.unbind();

        this._render.selection._isSelecting = false;
        this._render.selection._startPosition = Vector.zero;
        this._render.selection._endPosition = Vector.zero;
        this._render.selection._width = 0;
        this._render.selection._height = 0;

        this._render._render();
        
        await new Promise(resolve => requestAnimationFrame(resolve));

        try {
            if (format === "json") {
                return this._exportToJson();
            }

            const blob = await new Promise<Blob | null>((resolve) => {
                const originalCanvas = this._render.canvas;
                const exportCanvas = document.createElement('canvas');
                
                let cropX = 0, cropY = 0, cropWidth = originalCanvas.width, cropHeight = originalCanvas.height;
                if (cutStart && cutEnd) {
                    cropX = Math.min(cutStart.x, cutEnd.x);
                    cropY = Math.min(cutStart.y, cutEnd.y);
                    cropWidth = Math.abs(cutEnd.x - cutStart.x);
                    cropHeight = Math.abs(cutEnd.y - cutStart.y);
                }
                
                const scaleFactor = this._getScaleFactor(quality ?? "high");
                exportCanvas.width = cropWidth * scaleFactor;  
                exportCanvas.height = cropHeight * scaleFactor;
                const ctx = exportCanvas.getContext('2d')!;

                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';

                ctx.scale(scaleFactor, scaleFactor);

                ctx.fillStyle = 'black';
                ctx.fillRect(0, 0, cropWidth, cropHeight);

                ctx.drawImage(
                    originalCanvas,
                    cropX, cropY, cropWidth, cropHeight,
                    0, 0, cropWidth, cropHeight
                );

                exportCanvas.toBlob(resolve, this._getFormat(format), 1.0);
            });

            if (blob) {
                return blob;
            } else {
                throw new Error("Failed to export canvas");
            }
        } finally {
            this._render.postExport();

            if (target) {
                this._render.snapSmart.bind(target);
            }
        }
    }
}