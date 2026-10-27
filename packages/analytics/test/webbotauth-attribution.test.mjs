import test from 'node:test';
import { attributionExperiment } from './fixtures/webbotauth-attribution.mjs';

test('independent signed controls preserve identity, coverage, digest-header, relabelling and replay boundaries', attributionExperiment);
