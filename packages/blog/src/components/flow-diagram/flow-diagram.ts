import { html } from '@nisli/core';
import type { TemplateResult } from '@nisli/core';

export type FlowDiagramTone = 'neutral' | 'blue' | 'warm' | 'rust';

export interface FlowDiagramStep {
  eyebrow?: string;
  title: string | TemplateResult;
  detail?: TemplateResult;
  connector?: string;
  tone?: FlowDiagramTone;
}

/**
 * Render a responsive, data-driven sequence without hand-positioned markup.
 * `connector` describes the transition from the current step to the next.
 */
export function FlowDiagram({
  label,
  steps,
}: {
  label: string;
  steps: readonly [FlowDiagramStep, FlowDiagramStep, ...FlowDiagramStep[]];
}) {
  return html`<ol class="flow-diagram" aria-label="${label}">
    ${steps.map((step, index) => html`<li class="flow-step">
      <div class="flow-node flow-node--${step.tone ?? 'neutral'}">
        ${step.eyebrow ? html`<span class="flow-eyebrow">${step.eyebrow}</span>` : ''}
        <strong class="flow-title">${step.title}</strong>
        ${step.detail ? html`<div class="flow-detail">${step.detail}</div>` : ''}
      </div>
      ${index < steps.length - 1 ? html`<div class="flow-edge">
        ${step.connector ? html`<span class="flow-edge-label">${step.connector}</span>` : ''}
        <span class="flow-arrow" aria-hidden="true">→</span>
      </div>` : ''}
    </li>`)}
  </ol>`;
}
