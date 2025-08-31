import type { Vector } from "../instances/common/Vector";

export type ShapeProps = {
    dragging?: boolean;
    position: Vector;
    zIndex?: number;
    rotation?: number;
    visible?: boolean;
}

export type CircleProps = ShapeProps & {
    radius: number;
    color?: string;
}

export type RectProps = ShapeProps & {
    width: number;
    height: number;
    color?: string;
    borderWidth?: number;
    borderColor?: string;
}