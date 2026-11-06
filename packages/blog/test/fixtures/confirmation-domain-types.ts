import { SubscriberAddress } from '../../../newsletter/src/confirmation.js';
import type { ConfirmationCommand } from '../../../newsletter/src/confirmation.js';

// A mutable structural lookalike must not bypass the address factory.
const unchecked = { value: 'not an address' };
// @ts-expect-error Only the validated class carries its private value identity.
const forged: SubscriberAddress = unchecked;
void forged;

function cannotReplaceValidatedAddress(command: ConfirmationCommand): void {
  // @ts-expect-error Application commands cannot accept an unchecked lookalike.
  command.email = unchecked;
  // @ts-expect-error Normalization cannot be changed after construction.
  command.email.value = 'changed@example.invalid';
}
void cannotReplaceValidatedAddress;

const parsed = SubscriberAddress.parse('reader@example.invalid');
if (parsed) {
  const valid: SubscriberAddress = parsed;
  void valid.value;
}
