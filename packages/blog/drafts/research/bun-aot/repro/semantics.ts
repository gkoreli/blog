function double(value: number): number { return value * 2; }
const claimedNumber: number = JSON.parse('"3"');
const generated = new Function('value', 'return value * 2');
console.log(JSON.stringify({ actualType: typeof claimedNumber, result: double(claimedNumber), generated: generated(4) }));
