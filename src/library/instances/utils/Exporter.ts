import { Render } from "../../Render";

export type ExportFormat = "png" | "jpeg" | "webp" | "json";
export type ExportQuality = "low" | "medium" | "high";

export interface ExportProps {
    format: ExportFormat;
    quality?: ExportQuality;
    name: string;
}

export class Exporter {
    private _render: Render;

    constructor(render: Render) {
        this._render = render;
    }

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

    private _exportToJson(): Blob {
        const data = this._render.serialize();
        const jsonString = JSON.stringify(data, null, 2);
        return new Blob([jsonString], { type: "application/json" });
    }

    public async download(props: ExportProps): Promise<void> {
        const blob = await this.export(props);
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${props.name}.${props.format}`;
        a.click();
        URL.revokeObjectURL(url);
    }

    public async export(props: ExportProps): Promise<Blob> {
        const { format, quality } = props;
        
        const target = this._render.snapSmart.getTarget();
        this._render.preExport();
        this._render.snapSmart.unbind();

        (this._render as any)._render();
        
        await new Promise(resolve => requestAnimationFrame(resolve));

        try {
            if (format === "json") {
                return this._exportToJson();
            }

            const blob = await new Promise<Blob | null>((resolve) => {
                const originalCanvas = this._render.canvas;
                const exportCanvas = document.createElement('canvas');
                
                const scaleFactor = this._getScaleFactor(quality ?? "high");
                exportCanvas.width = originalCanvas.width * scaleFactor;  
                exportCanvas.height = originalCanvas.height * scaleFactor;
                const ctx = exportCanvas.getContext('2d')!;

                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';

                ctx.scale(scaleFactor, scaleFactor);

                ctx.fillStyle = 'black';
                ctx.fillRect(0, 0, originalCanvas.width, originalCanvas.height);

                ctx.drawImage(originalCanvas, 0, 0);

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