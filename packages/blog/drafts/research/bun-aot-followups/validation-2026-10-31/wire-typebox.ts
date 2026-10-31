// Explicitly register dependencies hidden behind Elysia's dynamic loader.
// This changes packaging only; route/schema compilation still happens at run time.
import { setupTypebox } from 'elysia';
import * as type from 'typebox/type';
import * as system from 'typebox/system';
import * as value from 'typebox/value';
import * as schema from 'typebox/schema';
import * as compile from 'typebox/compile';
import exactMirror from 'exact-mirror';
setupTypebox({ typebox: { type, system, value, schema, compile }, exactMirror });
