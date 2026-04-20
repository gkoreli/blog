export interface Signal<T> {
  read(): T;
  pause(): void;
  resume(): void;
  dispose(): void;
}

export interface WritableSignal<T> extends Signal<T> {
  write(value: T): void;
}

export function createValueSignal<T>(initialValue: T): WritableSignal<T> {
  let value = initialValue;
  let disposed = false;

  return {
    read(): T {
      return value;
    },

    write(nextValue: T): void {
      if (disposed) return;
      value = nextValue;
    },

    pause(): void {
      // Value signals do not own background work.
    },

    resume(): void {
      // Value signals do not own background work.
    },

    dispose(): void {
      disposed = true;
    },
  };
}
