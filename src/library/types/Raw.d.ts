import type { Vector } from "../instances/common/Vector";

export type ShapeType = "circle" | "rect";

export type ShapeRawData = {
    id: string;
    type: ShapeType;
    position: Vector;
    rotation: number;
    zIndex: number;
    dragging: boolean;
    visible: boolean;
}

export type CircleRawData = ShapeRawData & {
    radius: number;
    color: string;
}

export type RectRawData = ShapeRawData & {
    width: number;
    height: number;
    color: string;
    borderWidth: number;
    borderColor: string;
}