import type { FrameTime, RendererAdapter, RuntimeScene, RuntimeSize } from './types.js';

export interface SceneMountOptions<TScene extends RuntimeScene = RuntimeScene> {
  readonly canvas: HTMLCanvasElement;
  readonly scene: TScene;
  readonly renderer: RendererAdapter<TScene>;
  readonly container?: HTMLElement;
  readonly visibilityTarget?: Element;
  readonly respectReducedMotion?: boolean;
  readonly intersectionThreshold?: number;
}

export interface MountedScene {
  start(): void;
  stop(): void;
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

  let disposed = false;
  let running = false;
  let visible = true;
  let animationFrame = 0;
  let startedAt: number | undefined;
  let lastNow: number | undefined;
  let frame = 0;
  let size = readSize(canvas);

  await renderer.init(canvas);
  applySize();

  const resizeObserver = new ResizeObserver(() => {
    size = readSize(canvas);
    applySize();
  });
  resizeObserver.observe(container);

  const intersectionObserver = new IntersectionObserver(
    entries => {
      visible = entries.some(entry => entry.isIntersecting);
      if (visible) start();
      else stop();
    },
    { threshold },
  );
  intersectionObserver.observe(visibilityTarget);

  const reducedMotion = shouldRespectReducedMotion(options.respectReducedMotion);
  if (reducedMotion) renderStaticFrame(performance.now());
  else start();

  function applySize(): void {
    if (size.width === 0 || size.height === 0) return;
    renderer.resize(size.width, size.height, size.dpr);
  }

  function buildFrameTime(now: number): FrameTime {
    if (startedAt === undefined) startedAt = now;
    const previousNow = lastNow ?? now;
    lastNow = now;

    const time: FrameTime = {
      now,
      deltaMs: now - previousNow,
      elapsedMs: now - startedAt,
      frame,
    };
    frame += 1;
    return time;
  }

  function renderStaticFrame(now: number): void {
    if (disposed || size.width === 0 || size.height === 0) return;
    const time = buildFrameTime(now);
    scene.update({ size, time });
    renderer.beginFrame(time);
    renderer.render(scene, time);
    renderer.endFrame(time);
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
  }

  function start(): void {
    if (disposed || running || !visible || reducedMotion) return;
    running = true;
    animationFrame = requestAnimationFrame(tick);
  }

  function stop(): void {
    if (!running) return;
    running = false;
    cancelAnimationFrame(animationFrame);
    animationFrame = 0;
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

  return { start, stop, dispose };
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
