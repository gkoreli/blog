interface Row {
  id: number;
  label: string;
  active: boolean;
  value: number;
}

const count = Number(process.env.ROWS ?? "250000");
const rounds = Number(process.env.ROUNDS ?? "40");
if (!Number.isSafeInteger(count) || count < 1 || count > 1000000) {
  throw new Error("ROWS must be an integer from 1 to 1000000");
}
if (!Number.isSafeInteger(rounds) || rounds < 1 || rounds > 1000) {
  throw new Error("ROUNDS must be an integer from 1 to 1000");
}

const rows: Row[] = [];
for (let id = 0; id < count; id++) {
  rows.push({ id, label: "row-" + id, active: id % 2 === 0, value: (id * 17) % 1009 });
}

let checksum = 0;
for (let round = 0; round < rounds; round++) {
  for (const row of rows) {
    if (row.active) checksum = (checksum + row.id + row.value + row.label.length) % 1000000007;
  }
}
console.log(JSON.stringify({ rows: rows.length, rounds, checksum }));
