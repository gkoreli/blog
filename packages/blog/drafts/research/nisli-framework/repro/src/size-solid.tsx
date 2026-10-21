import { createSignal } from 'solid-js';
import { render } from '@solidjs/web';
render(() => {
  const [count, setCount] = createSignal(0);
  return <button onClick={() => setCount(count() + 1)}>Count: {count()}</button>;
}, document.body);
