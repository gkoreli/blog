import type { EffectStageDefinition, PipeDefinition } from '../effects/index.js';

export interface PipelineGroups {
  readonly transitionPipes: readonly PipeDefinition[];
  readonly continuousPipes: readonly PipeDefinition[];
}

export function compilePipelines(pipes: readonly PipeDefinition[]): PipelineGroups {
  const transitionPipes: PipeDefinition[] = [];
  const continuousPipes: PipeDefinition[] = [];

  for (const pipe of pipes) {
    const transitionStages: EffectStageDefinition[] = [];
    const continuousStages: EffectStageDefinition[] = [];

    for (const stage of pipe.stages) {
      if (stage.when.kind === 'on-enter-zone' || stage.when.kind === 'on-exit-zone') {
        transitionStages.push(stage);
      } else {
        continuousStages.push(stage);
      }
    }

    if (transitionStages.length > 0) {
      transitionPipes.push({ ...pipe, stages: transitionStages });
    }

    if (continuousStages.length > 0) {
      continuousPipes.push({ ...pipe, stages: continuousStages });
    }
  }

  return { transitionPipes, continuousPipes };
}
