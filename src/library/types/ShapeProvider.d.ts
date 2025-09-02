import type { Vector } from "../instances/common/Vector";
import type { Shape } from "../instances/Shape";

export type ShapeEventTemplate = {
    pointer: {
        relative: Vector;
        absolute: Vector;
    },
    target: Shape;
}

export type ShapeEventBlank = {}

export type ShapeEventClick = ShapeEventTemplate;
export type ShapeEventDragStart = ShapeEventTemplate;
export type ShapeEventDragEnd = ShapeEventTemplate;
export type ShapeEventDrag = ShapeEventTemplate;
export type ShapeEventMouseDown = ShapeEventTemplate;
export type ShapeEventMouseUp = ShapeEventTemplate;
export type ShapeEventInput = { value: string };
export type ShapeEventDestroy = {};

export type ShapeEventsMap = {
    "click": ShapeEventClick;
    "dblclick": ShapeEventClick;
    "dragstart": ShapeEventDragStart;
    "dragend": ShapeEventDragEnd;
    "drag": ShapeEventDrag;
    "input": ShapeEventInput;
    "destroy": ShapeEventDestroy;
}

export type ShapeEventsType = keyof ShapeEventsMap;
export type ShapeListenerCallback<T extends ShapeEventsType> = (args: ShapeEventsMap[T]) => void;