export type Awaitable<T> = T | Promise<T>;

export type SceneId = string;
export type PrimitiveId = string;
export type ParticleSystemId = string;
export type FieldId = string;
export type ZoneId = string;
export type EmitterId = string;
export type TextSourceId = string;
export type MaterialId = string;
export type EffectId = string;
export type TimelineId = string;
export type ColorValue = number | string;

export interface RuntimeSize {
  readonly width: number;
  readonly height: number;
  readonly dpr: number;
}

export interface FrameTime {
  readonly now: number;
  readonly deltaMs: number;
  readonly elapsedMs: number;
  readonly frame: number;
}

export interface RuntimeUpdateContext {
  readonly size: RuntimeSize;
  readonly time: FrameTime;
}

export interface RuntimePrimitive<TKind extends string = string, TData = unknown> {
  readonly kind: TKind;
  readonly id: PrimitiveId;
  readonly data: TData;
}

export interface RuntimeScene {
  readonly id: SceneId;
  update(context: RuntimeUpdateContext): void;
  primitives(): readonly RuntimePrimitive[];
  dispose(): void;
}

export interface RendererAdapter<TScene extends RuntimeScene = RuntimeScene> {
  init(canvas: HTMLCanvasElement): Awaitable<void>;
  resize(width: number, height: number, dpr: number): void;
  beginFrame(time: FrameTime): void;
  render(scene: TScene, time: FrameTime): void;
  endFrame(time: FrameTime): void;
  dispose(): void;
}
