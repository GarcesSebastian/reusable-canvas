// Clases
export { Vector } from "./library/instances/common/Vector";
export { Circle } from "./library/instances/_shapes/Circle";
export { Rect } from "./library/instances/_shapes/Rect";
export { Render } from "./library/Render";
export { RenderCreator } from "./library/helpers/Render.creator";
export { Text } from "./library/instances/_shapes/Text";
 
// Tipos
export type { CircleRawData, RectRawData, ShapeRawData } from "./library/types/Raw";

export type { 
    ShapeEventsType as _ShapeEventsType,
    ShapeEventsMap as _ShapeEventsMap,
    ShapeListenerCallback as _ShapeListenerCallback,
    ShapeEventTemplate as _ShapeEventTemplate,
    ShapeEventClick as _ShapeEventClick,
    ShapeEventDrag as _ShapeEventDrag,
    ShapeEventDragEnd as _ShapeEventDragEnd,
    ShapeEventDragStart as _ShapeEventDragStart,
    ShapeEventDestroy as _ShapeEventDestroy
} from "./library/types/ShapeProvider";

export type { 
    RenderEventsType as _RenderEventsType,
    RenderEventMap as _RenderEventMap,
    ListenerCallback as _ListenerCallback,
    RenderEventTemplate as _RenderEventTemplate,
    RenderEventClick as _RenderEventClick,
    RenderEventMouseDown as _RenderEventMouseDown,
    RenderEventMouseMove as _RenderEventMouseMove,
    RenderEventMouseUp as _RenderEventMouseUp,
    RenderEventCreate as _RenderEventCreate
} from "./library/types/RenderProvider";
