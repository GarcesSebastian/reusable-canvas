import type { Vector } from "../instances/common/Vector";

export type ShapeType = "circle" | "rect" | "text" | "image";

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

export type TextRawData = ShapeRawData & {
    text: string;
    fontSize: number;
    fontFamily: string;
    fontWeight: string;
    fontStyle: string;
    textAlign: string;
    color: string;
    backgroundColor: string;
    borderWidth: number;
    borderColor: string;
    padding: { top: number; right: number; bottom: number; left: number };
    width: number;
    height: number;
}

export type ImageRawData = ShapeRawData & {
    src: string;
    width: number;
    height: number;
    borderWidth: number;
    borderColor: string;
    cornerRadius: number;
}