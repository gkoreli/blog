import { z } from "zod";

if (process.argv.includes("--jitless")) z.config({ jitless: true });
const schema = z.object({ id: z.number(), name: z.string(), enabled: z.boolean() });
const values: unknown[] = JSON.parse(
  process.env.INPUT ?? '[{"id":1,"name":"a","enabled":true},{"id":2,"name":"b","enabled":false}]',
);
const iterations = Number(process.env.ITERATIONS ?? "2000000");

if (!Number.isSafeInteger(iterations) || iterations < 1 || values.length === 0) {
  throw new Error("Use positive ITERATIONS and a nonempty INPUT array");
}

if (process.argv.includes("--verify")) {
  console.log(JSON.stringify(values.map((value) => schema.safeParse(value))));
} else {
  let passed = 0;
  for (let i = 0; i < iterations; i++) {
    if (schema.safeParse(values[i % values.length]).success) passed++;
  }
  console.log(JSON.stringify({ passed }));
}
