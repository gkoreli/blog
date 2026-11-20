import { html } from '@nisli/core';

interface DropdownOption {
  value: string;
  label: string;
  accessibleLabel?: string;
}

interface DropdownField {
  id: string;
  label: string;
  options: readonly DropdownOption[];
  name?: string;
  value?: string;
  disabled?: boolean;
  describedBy?: string;
}

/** The select owns focus, keyboard input, submission, reset and change events. */
export function dropdown({ id, label, options, name, value, disabled, describedBy }: DropdownField) {
  return html`<div class="dropdown-field">
    <label class="dropdown-label" for=${id}>${label}</label>
    <span class="dropdown-control">
      <select id=${id} name=${name} disabled=${disabled} aria-describedby=${describedBy}>
        ${options.map(option => html`<option value=${option.value} selected=${option.value === value}
          aria-label=${option.accessibleLabel}>${option.label}</option>`)}
      </select>
    </span>
  </div>`;
}
