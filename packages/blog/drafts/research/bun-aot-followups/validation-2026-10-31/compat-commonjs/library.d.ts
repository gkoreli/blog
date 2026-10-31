export enum Kind { Value = 42, Object = 999, Array = 996 }
export enum Tag { Object = Kind.Object, Array = Kind.Array }
export interface Options { type: Kind; length: number; tag?: Tag }
export function make(options: Options): Options;
