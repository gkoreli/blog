import { z } from 'zod';
const schema = z.object({ id: z.number(), name: z.string(), enabled: z.boolean() });
const values: unknown[] = JSON.parse(process.env.INPUT ?? '[{"id":1,"name":"a","enabled":true},{"id":2,"name":"b","enabled":false}]');
const iterations = Number(process.env.ITERATIONS ?? '1000000');
let passed = 0;
for (let i = 0; i < iterations; i++) if (schema.safeParse(values[i % values.length]).success) passed++;
console.log(JSON.stringify({ passed }));
