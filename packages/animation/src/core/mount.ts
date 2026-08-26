import type { FrameTime, RendererAdapter, RuntimeScene, RuntimeSize } from './types.js';

export interface SceneMountOptions<TScene extends RuntimeScene = RuntimeScene> {
  readonly canvas: HTMLCanvasElement;
  readonly scene: TScene;
  readonly renderer: RendererAdapter<TScene>;
  readonly container?: HTMLElement;
  readonly visibilityTarget?: Element;
  readonly respectReducedMotion?: boolean;
  readonly intersectionThreshold?: number;
  readonly onFrame?: (time: FrameTime, scene: TScene) => void;
}

export interface MountedScene {
  start(): void;
  stop(): void;
  renderCurrentFrame(): void;
  dispose(): void;
}

const DEFAULT_INTERSECTION_THRESHOLD = 0.1;

export async function mountScene<TScene extends RuntimeScene>(
  options: SceneMountOptions<TScene>,
): Promise<MountedScene> {
  const canvas = options.canvas;
  const container = options.container ?? canvas;
  const visibilityTarget = options.visibilityTarget ?? container;
  const threshold = options.intersectionThreshold ?? DEFAULT_INTERSECTION_THRESHOLD;
  const renderer = options.renderer;
  const scene = options.scene;
  const reducedMotion = shouldRespectReducedMotion(options.respectReducedMotion);

  let disposed = false;
  let requestedRunning = false;
  let running = false;
  let visible = true;
  let animationFrame = 0;
  let lastNow: number | undefined;
  let activeElapsedMs = 0;
  let frame = 0;
  let lastFrameTime: FrameTime | undefined;
  let size = readSize(canvas);

  await renderer.init(canvas);
  applySize();

  const resizeObserver = new ResizeObserver(() => {
    size = readSize(canvas);
    applySize();
    updateRunningState();
    if (reducedMotion) renderCurrentFrame();
  });
  resizeObserver.observe(container);

  const intersectionObserver = new IntersectionObserver(
    entries => {
      visible = entries.some(entry => entry.isIntersecting);
      updateRunningState();
    },
    { threshold },
  );
  intersectionObserver.observe(visibilityTarget);

  if (reducedMotion) renderStaticFrame(performance.now());
  else start();

  function applySize(): void {
    if (size.width === 0 || size.height === 0) return;
    renderer.resize(size.width, size.height, size.dpr);
  }

  function buildFrameTime(now: number): FrameTime {
    const previousNow = lastNow ?? now;
    const deltaMs = now - previousNow;
    lastNow = now;
    activeElapsedMs += deltaMs;

    const time: FrameTime = {
      now,
      deltaMs,
      elapsedMs: activeElapsedMs,
      frame,
    };
    frame += 1;
    lastFrameTime = time;
    return time;
  }

  function renderStaticFrame(now: number): void {
    if (disposed || size.width === 0 || size.height === 0) return;
    const time = buildFrameTime(now);
    scene.update({ size, time });
    renderer.beginFrame(time);
    renderer.render(scene, time);
    renderer.endFrame(time);
    options.onFrame?.(time, scene);
  }

  function tick(now: number): void {
    if (disposed || !running) return;
    animationFrame = requestAnimationFrame(tick);
    if (size.width === 0 || size.height === 0) return;

    const time = buildFrameTime(now);
    scene.update({ size, time });
    renderer.beginFrame(time);
    renderer.render(scene, time);
    renderer.endFrame(time);
    options.onFrame?.(time, scene);
  }

  function start(): void {
    if (disposed) return;
    requestedRunning = true;
    updateRunningState();
  }

  function stop(): void {
    requestedRunning = false;
    updateRunningState();
  }

  function updateRunningState(): void {
    if (!disposed && requestedRunning && visible && size.width > 0 && size.height > 0 && !reducedMotion) {
      if (running) return;
      running = true;
      lastNow = undefined;
      animationFrame = requestAnimationFrame(tick);
      return;
    }

    if (!running) return;
    running = false;
    cancelAnimationFrame(animationFrame);
    animationFrame = 0;
    lastNow = undefined;
  }
  function renderCurrentFrame(): void {
    if (disposed || size.width === 0 || size.height === 0) return;
    const time: FrameTime = lastFrameTime ?? {
      now: performance.now(),
      deltaMs: 0,
      elapsedMs: activeElapsedMs,
      frame: 0,
    };
    renderer.beginFrame(time);
    renderer.render(scene, time);
    renderer.endFrame(time);
  }


  function dispose(): void {
    if (disposed) return;
    disposed = true;
    stop();
    resizeObserver.disconnect();
    intersectionObserver.disconnect();
    renderer.dispose();
    scene.dispose();
  }

  return { start, stop, renderCurrentFrame, dispose };
}

function readSize(canvas: HTMLCanvasElement): RuntimeSize {
  const rect = canvas.getBoundingClientRect();
  return {
    width: Math.max(0, rect.width),
    height: Math.max(0, rect.height),
    dpr: Math.max(1, window.devicePixelRatio || 1),
  };
}

function shouldRespectReducedMotion(option: boolean | undefined): boolean {
  if (option === false) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
