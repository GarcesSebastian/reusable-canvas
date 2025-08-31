// Clases ejecutables
export { Render } from "./library/Render";
export { RenderCreator } from "./library/helpers/Render.creator";
export { Circle } from "./library/instances/_shapes/Circle";
export { Rect } from "./library/instances/_shapes/Rect";
export { Vector } from "./library/instances/common/Vector";

// Tipos
export type { CircleProps, RectProps, ShapeProps } from "./library/types/Shape";
export type { CircleRawData, RectRawData, ShapeRawData } from "./library/types/Raw";
export type { 
    RenderEventsType,
    RenderEventMap,
    ListenerCallback,
    RenderEventTemplate,
    RenderEventClick,
    RenderEventMouseDown,
    RenderEventMouseMove,
    RenderEventMouseUp,
    RenderEventCreate
 } from "./library/types/RenderProvider";
export type { 
    ShapeEventsType,
    ShapeEventsMap,
    ShapeListenerCallback,
    ShapeEventTemplate,
    ShapeEventClick,
    ShapeEventDrag,
    ShapeEventDragEnd,
    ShapeEventDragStart,
    ShapeEventDestroy
 } from "./library/types/ShapeProvider";