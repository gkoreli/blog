export interface Counts { reads: number; setups: number }

export interface Mounted {
  set(index: number, value: number): void;
  counts: Counts;
  dispose(): Promise<void>;
}

export interface Adapter {
  name: string;
  mount(host: HTMLElement, size: number, instrument: boolean): Promise<Mounted>;
}

export async function drain(): Promise<void> {
  // Same scheduling allowance for every adapter; no framework-specific flush.
  for (let i = 0; i < 6; i++) await Promise.resolve();
}

export function requireElement<T extends Element>(element: T | null): T {
  if (!element) throw new Error('Expected fixture element is missing');
  return element;
}

export function deferred<T>() {
  let resolve: (value: T) => void = () => { throw new Error('Uninitialized deferred'); };
  const promise = new Promise<T>(complete => { resolve = complete; });
  return { promise, resolve };
}

export async function until(predicate: () => boolean, description: string): Promise<void> {
  const end = performance.now() + 3000;
  while (!predicate()) {
    if (performance.now() > end) throw new Error(`Timed out: ${description}`);
    await new Promise<void>(resolve => setTimeout(resolve, 0));
  }
}

export function check(condition: boolean, description: string): void {
  if (!condition) throw new Error(description);
}
