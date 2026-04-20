import type { RuntimePrimitive, RuntimeScene, RuntimeUpdateContext, SceneId } from './types.js';

export interface RuntimeSceneOptions {
  readonly id: SceneId;
  readonly primitives?: readonly RuntimePrimitive[];
  readonly update?: (context: RuntimeUpdateContext) => void;
  readonly dispose?: () => void;
}

export function createRuntimeScene(options: RuntimeSceneOptions): RuntimeScene {
  const primitives = [...(options.primitives ?? [])];
  const updateScene = options.update;
  const disposeScene = options.dispose;

  return {
    id: options.id,

    update(context: RuntimeUpdateContext): void {
      updateScene?.(context);
    },

    primitives(): readonly RuntimePrimitive[] {
      return primitives;
    },

    dispose(): void {
      disposeScene?.();
    },
  };
}
