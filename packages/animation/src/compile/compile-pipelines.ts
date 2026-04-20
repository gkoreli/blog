import type { PipeDefinition } from '../effects/index.js';

export interface PipelineGroups {
  readonly transitionPipes: readonly PipeDefinition[];
  readonly continuousPipes: readonly PipeDefinition[];
}

export function compilePipelines(pipes: readonly PipeDefinition[]): PipelineGroups {
  const transitionPipes: PipeDefinition[] = [];
  const continuousPipes: PipeDefinition[] = [];

  for (const pipe of pipes) {
    if (pipe.stages.some(stage => stage.when.kind === 'on-enter-zone' || stage.when.kind === 'on-exit-zone')) {
      transitionPipes.push(pipe);
    } else {
      continuousPipes.push(pipe);
    }
  }

  return { transitionPipes, continuousPipes };
}
