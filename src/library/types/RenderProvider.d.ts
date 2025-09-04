import type { Vector } from "../instances/common/Vector";
import type { Shape } from "../instances/Shape";
import type { Render } from "../Render";
import { ShapeRawData } from "./Raw";

export type RenderEventTemplate = {
    pointer: {
        absolute: Vector;
        world: Vector;
    },
    target: Shape | Render;
}

export type RenderEventBlank = {}

export type RenderEventClick = RenderEventTemplate;
export type RenderEventMouseMove = RenderEventTemplate;
export type RenderEventMouseDown = RenderEventTemplate;
export type RenderEventMouseUp = RenderEventTemplate;
export type RenderEventCreate = { shape: Shape };
export type RenderEventSave = { data: ShapeRawData[] };
export type RenderEventLoad = { data: ShapeRawData[] };

export type RenderEventMap = {
    "click": RenderEventClick;
    "dblclick": RenderEventClick;
    "mousemove": RenderEventMouseMove;
    "mousedown": RenderEventMouseDown;
    "mouseup": RenderEventMouseUp;
    "create": RenderEventCreate;
    "undo": RenderEventBlank;
    "redo": RenderEventBlank;
    "save": RenderEventSave;
    "load": RenderEventLoad;
    "copy": RenderEventBlank;
    "cut": RenderEventBlank;
    "paste": RenderEventBlank;
    "delete": RenderEventBlank;
    "selectAll": RenderEventBlank;
    "top": RenderEventBlank;
    "bottom": RenderEventBlank;
    "front": RenderEventBlank;
    "back": RenderEventBlank;
    "update": RenderEventBlank;
}

export type RenderEventsType = keyof RenderEventMap;
export type ListenerCallback<T extends RenderEventsType> = (args: RenderEventMap[T]) => void;