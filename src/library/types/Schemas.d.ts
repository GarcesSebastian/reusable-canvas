import { IShape } from "../instances/Shape";

export interface NodeSchema extends IShape {
    id: string;
}

export interface ConfigurationSchema extends RenderProperties {
    id: string;
}