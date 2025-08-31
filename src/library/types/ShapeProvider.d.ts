import type { Vector } from "../instances/common/Vector";
import type { Shape } from "../instances/Shape";

export type ShapeEventTemplate = {
    pointer: {
        relative: Vector;
        absolute: Vector;
    },
    target: Shape;
}

export type ShapeEventClick = ShapeEventTemplate;
export type ShapeEventDragStart = ShapeEventTemplate;
export type ShapeEventDragEnd = ShapeEventTemplate;
export type ShapeEventDrag = ShapeEventTemplate;
export type ShapeEventDestroy = ShapeEventTemplate;

export type ShapeEventsMap = {
    "click": ShapeEventClick;
    "dragstart": ShapeEventDragStart;
    "dragend": ShapeEventDragEnd;
    "drag": ShapeEventDrag;
    "destroy": ShapeEventDestroy;
}

export type ShapeEventsType = keyof ShapeEventsMap;
export type ShapeListenerCallback<T extends ShapeEventsType> = (args?: ShapeEventsMap[T]) => void;