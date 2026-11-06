import assert from 'node:assert/strict';
import test from 'node:test';
import {
  RETAINED_CLIENT_PRODUCT_PROFILE, RETAINED_CLIENT_PRODUCTS_20261106,
  RETAINED_CLIENT_PRODUCT_PROFILES, LEGACY_RETAINED_CLIENT_PRODUCTS,
  encodeMatchedProducts, retainedMatchedProducts,
} from '../.test-dist/retained-client-products.js';
import { KNOWN_CLIENT_PRODUCTS } from '../.test-dist/client-registry.js';

function encoded(products) {
  return { version: '2026-11-06.1', declarations: encodeMatchedProducts(products) };
}

test('current frozen product profile exactly covers the live catalogue and cannot change in place', () => {
  const products = RETAINED_CLIENT_PRODUCTS_20261106;
  assert.equal(products.length, 74);
  assert.equal(new Set(products).size, products.length);
  assert.deepEqual([...products].sort(), [...KNOWN_CLIENT_PRODUCTS].sort());
  assert.ok(Object.isFrozen(products));
  assert.ok(Object.isFrozen(RETAINED_CLIENT_PRODUCT_PROFILES));
  assert.ok(Object.isFrozen(RETAINED_CLIENT_PRODUCT_PROFILES[0]));
  assert.throws(() => { products[0] = 'changed'; }, TypeError);
  assert.equal(RETAINED_CLIENT_PRODUCT_PROFILES[0].profile, RETAINED_CLIENT_PRODUCT_PROFILE);
});

test('empty, every singleton/pair, prefixes, complements and all aliases round-trip losslessly', () => {
  const products = RETAINED_CLIENT_PRODUCTS_20261106;
  const roundTrip = subset => {
    const result = encoded(subset), bytes = JSON.stringify(result);
    assert.deepEqual(retainedMatchedProducts(result), [...subset].sort());
    assert.equal(JSON.stringify(result), bytes, 'decoder does not rewrite retained evidence');
    assert.match(result.declarations.matchedProductBits, /^(?:0|[1-9a-f][0-9a-f]*)$/);
    assert.ok(result.declarations.matchedProductBits.length <= 19);
  };
  roundTrip([]);
  for (let i = 0; i < products.length; i++) {
    roundTrip([products[i]]);
    roundTrip(products.slice(0, i));
    roundTrip(products.filter((_product, index) => index !== i));
    for (let j = i + 1; j < products.length; j++) roundTrip([products[j], products[i]]);
  }
  roundTrip(products);
  assert.equal(encoded([]).declarations.matchedProductBits, '0');
  assert.equal(encoded([products[0]]).declarations.matchedProductBits, '1');
  assert.equal(encoded([products.at(-1)]).declarations.matchedProductBits, '2000000000000000000');
  assert.equal(encoded(products).declarations.matchedProductBits, '3ffffffffffffffffff');
});

test('unknown, duplicate or oversized producer inputs fail instead of dropping aliases', () => {
  for (const products of [['FutureBot'], ['GPTBot', 'GPTBot'], ['gptbot'], ['GPTBot', 'private-product'], Array(75).fill('GPTBot')]) {
    assert.throws(() => encodeMatchedProducts(products));
  }
});

test('legacy arrays remain independent, closed, unchanged and readable under each historical schema', () => {
  assert.equal(LEGACY_RETAINED_CLIENT_PRODUCTS.length, 57);
  for (const version of ['2026-10-27.2', '2026-10-29.1', '2026-10-29.2']) {
    const old = { version, classifierProfile: 'historical-producer', declarations: { matchedProducts: [...LEGACY_RETAINED_CLIENT_PRODUCTS].reverse() } };
    const before = JSON.stringify(old);
    assert.deepEqual(retainedMatchedProducts(old), [...LEGACY_RETAINED_CLIENT_PRODUCTS].sort());
    assert.equal(JSON.stringify(old), before);
    assert.deepEqual(retainedMatchedProducts({ version, declarations: { matchedProducts: [] } }), []);
    for (const products of [['FutureBot'], ['AI2Bot'], ['GPTBot', 'GPTBot'], ['gptbot'], [1], Array(1), [, 'GPTBot'], null]) {
      assert.equal(retainedMatchedProducts({ version, declarations: { matchedProducts: products } }), null);
    }
    assert.equal(retainedMatchedProducts({ version, declarations: { matchedProducts: ['GPTBot'], productProfile: RETAINED_CLIENT_PRODUCT_PROFILE, matchedProductBits: '1' } }), null);
  }
});

test('malformed/future profiles and bits stay explicitly unassessed without BigInt over-budget parsing', () => {
  const valid = encoded(['GPTBot']);
  for (const bits of ['', '00', '01', 'A', '0x1', '-1', '1.0', '1 ', ' 1', 'g', '4' + '0'.repeat(18), 'f'.repeat(20), 'f'.repeat(100000), 1, 1n, null, [], {}]) {
    assert.equal(retainedMatchedProducts({ ...valid, declarations: { ...valid.declarations, matchedProductBits: bits } }), null);
  }
  for (const profile of ['future', '', null, 1, {}, []]) {
    assert.equal(retainedMatchedProducts({ ...valid, declarations: { ...valid.declarations, productProfile: profile } }), null);
  }
  for (const value of [null, [], {}, { version: 'future', declarations: valid.declarations }, { version: valid.version, declarations: [] },
    { ...valid, declarations: { ...valid.declarations, matchedProducts: ['GPTBot'] } },
    { version: valid.version, declarations: { matchedProducts: ['GPTBot'] } },
    { ...valid, declarations: { productProfile: RETAINED_CLIENT_PRODUCT_PROFILE } }]) assert.equal(retainedMatchedProducts(value), null);
});
