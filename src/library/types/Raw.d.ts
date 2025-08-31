import type { Vector } from "../instances/common/Vector";

export type ShapeType = "circle" | "rect";

export interface ShapeRawData {
    id: string;
    type: ShapeType;
    position: Vector;
    rotation: number;
    zIndex: number;
    dragging: boolean;
    visible: boolean;
}

export interface CircleRawData extends ShapeRawData {
    radius: number;
    color: string;
}

export interface RectRawData extends ShapeRawData {
    width: number;
    height: number;
    color: string;
    borderWidth: number;
    borderColor: string;
}