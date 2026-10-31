import { validInput } from './data.mjs';

// Hand-labeled JSON inputs exercise each constraint beyond the timed corpus.
export function deepCases(kind) {
  const cases = [];
  const add = (name, value, expected) => cases.push({ name, value, expected });
  const mutate = (name, change, expected = false) => {
    const value = validInput(kind, 2);
    change(value);
    add(name, value, expected);
  };
  for (const value of [null, [], true, false, 0, 1.5, '', 'object']) add(`root-${JSON.stringify(value)}`, value, false);
  add('empty-object', {}, false);
  add('ordinary-valid', validInput(kind, 2), true);
  mutate('missing-id', value => delete value.id);
  for (const value of ['1', null, true, 1.5]) mutate(`id-type-${JSON.stringify(value)}`, item => item.id = value);
  mutate('zero-id', value => value.id = 0, kind === 'defaults');
  mutate('negative-id', value => value.id = -1, kind === 'defaults');
  mutate('large-id', value => value.id = 2147483648, true);
  mutate('max-safe-id', value => value.id = Number.MAX_SAFE_INTEGER, true);
  mutate('extra-property', value => value.extra = 'kept', kind !== 'defaults');
  add('own-proto-key', { ...validInput(kind, 2), ['__proto__']: { label: 'ordinary JSON data' } }, kind !== 'defaults');
  add('own-constructor-key', { ...validInput(kind, 2), constructor: 'ordinary JSON data' }, kind !== 'defaults');
  if (kind === 'simple') {
    mutate('missing-name', value => delete value.name);
    for (const value of ['', 1, null, false, [], {}]) mutate(`name-${JSON.stringify(value)}`, item => item.name = value);
    mutate('unicode-name', value => value.name = 'გოგა 🦞', true);
    mutate('multiple-errors', value => { value.id = 0; value.name = ''; });
  } else if (kind === 'nested') {
    for (const key of ['status', 'user', 'items']) mutate(`missing-${key}`, value => delete value[key]);
    for (const status of ['active', 'inactive', 'pending']) mutate(`status-${status}`, value => value.status = status, true);
    for (const status of ['', 'other', 1, null]) mutate(`status-${JSON.stringify(status)}`, value => value.status = status);
    for (const user of [null, [], true, 'name', {}]) mutate(`user-${JSON.stringify(user)}`, value => value.user = user);
    for (const key of ['firstName', 'lastName', 'email']) mutate(`user-missing-${key}`, value => delete value.user[key]);
    mutate('empty-first-name', value => value.user.firstName = '');
    mutate('unicode-first-name', value => value.user.firstName = 'გოგა 🦞', true);
    mutate('invalid-email', value => value.user.email = 'no-at-sign');
    mutate('missing-age-is-valid', value => delete value.user.age, true);
    for (const age of [0, 150]) mutate(`age-boundary-${age}`, value => value.user.age = age, true);
    for (const age of [-1, 151, 12.5, '30', null]) mutate(`age-${JSON.stringify(age)}`, value => value.user.age = age);
    for (const items of [[], null, {}, 'items', [null], [{}]]) mutate(`items-${JSON.stringify(items)}`, value => value.items = items);
    for (const key of ['sku', 'quantity', 'price']) mutate(`item-missing-${key}`, value => delete value.items[0][key]);
    mutate('empty-sku', value => value.items[0].sku = '');
    for (const quantity of [0, -1, 1.5, '1', null]) mutate(`quantity-${JSON.stringify(quantity)}`, value => value.items[0].quantity = quantity);
    mutate('zero-price', value => value.items[0].price = 0, true);
    for (const price of [-1, '1', null]) mutate(`price-${JSON.stringify(price)}`, value => value.items[0].price = price);
    mutate('later-item-invalid', value => value.items[2].quantity = 0);
    mutate('multiple-errors', value => { value.id = 0; value.status = 'other'; value.user.email = 'bad'; value.items[0].quantity = 0; });
  } else {
    mutate('default-field-explicit-true', value => value.enabled = true, true);
    mutate('default-field-explicit-false', value => value.enabled = false, true);
    for (const enabled of [null, 0, 1, 'true', []]) mutate(`enabled-${JSON.stringify(enabled)}`, value => value.enabled = enabled);
    mutate('multiple-errors', value => { value.id = 'bad'; value.extra = 1; });
  }
  return cases;
}
