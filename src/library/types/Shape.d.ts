import type { Vector } from "../instances/common/Vector";

export interface ShapeProps {
    dragging?: boolean;
    position: Vector;
    zIndex?: number;
    rotation?: number;
    visible?: boolean;
}

export interface CircleProps extends ShapeProps {
    radius: number;
    color?: string;
}

export interface RectProps extends ShapeProps {
    width: number;
    height: number;
    color?: string;
    borderWidth?: number;
    borderColor?: string;
}