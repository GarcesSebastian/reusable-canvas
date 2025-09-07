export type TransformerEventBlank = {}

export type TransformerEventsMap = {
    "resizestart": TransformerEventBlank;
    "resize": TransformerEventBlank;
    "resizeend": TransformerEventBlank;
    "movestart": TransformerEventBlank;
    "move": TransformerEventBlank;
    "moveend": TransformerEventBlank;
}

export type TransformerEventsType = keyof TransformerEventsMap;
export type TransformerListenerCallback<T extends TransformerEventsType> = (args: TransformerEventsMap[T]) => void;