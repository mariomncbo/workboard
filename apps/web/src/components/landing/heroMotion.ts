/**
 * Motion of the landing hero, inspired by Axon (MotionSites):
 * - the page dot grid, with the same values as the app's AppBackground, fading out around
 *   the video window ("halo") so its dots never touch the board's own dots;
 * - the WorkBoard symbol made of particles: it turns slowly with perspective, breathes,
 *   swirls around the cursor (stronger the faster it moves) and heals back.
 * The caller decides where the symbol is on every frame (it moves while scrolling).
 */

export type SymbolPlace = { x: number; y: number; size: number };

type Options = {
  gridCanvas: HTMLCanvasElement;
  symbolCanvas: HTMLCanvasElement;
  /** Elements the page grid keeps away from (the video window). */
  haloElements: () => HTMLElement[];
  /** Where the symbol is now, inside the symbol canvas (width × height in CSS px). */
  placeSymbol: (width: number, height: number) => SymbolPlace;
};

// App background values (AppBackground).
const GRID = 20;
const DOT_SIZE = 1;
const RADIUS = 140;
const GROWTH = 1.4;
const PUSH = 11;
const TINT = 0.75;
/** Margin where the page grid fades out around the video window. */
const HALO = 64;

// The symbol: three rounded columns in a 100 × 100 box (brand/logo).
const BARS = [
  [14, 14, 20, 72],
  [40, 14, 20, 46],
  [66, 14, 20, 72],
] as const;

function inSymbol(u: number, v: number) {
  return BARS.some(([x, y, w, h]) => {
    if (u < x || u > x + w || v < y || v > y + h) return false;
    const r = 6;
    const cx = Math.min(Math.max(u, x + r), x + w - r);
    const cy = Math.min(Math.max(v, y + r), y + h - r);
    return (u - cx) ** 2 + (v - cy) ** 2 <= r * r;
  });
}

const smooth = (t: number) => {
  const c = Math.min(1, Math.max(0, t));
  return c * c * (3 - 2 * c);
};

function readColor(name: string): number[] {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return [1, 3, 5].map((i) => parseInt(value.slice(i, i + 2), 16));
}

const mix = (a: number[], b: number[], t: number) => `rgb(${a.map((c, i) => Math.round(c + (b[i] - c) * t)).join(",")})`;

type Dot = { x: number; y: number; s: number };
type Particle = { hx: number; hy: number; hz: number; x: number; y: number; vx: number; vy: number; seed: number; s: number };

/** Starts the motion. Returns a function that stops it and removes its listeners. */
export function startHeroMotion({ gridCanvas, symbolCanvas, haloElements, placeSymbol }: Options): () => void {
  const gridContext = gridCanvas.getContext("2d");
  const symbolContext = symbolCanvas.getContext("2d");
  if (!gridContext || !symbolContext) return () => {};

  const DOT = readColor("--backdrop-dot");
  const ACCENT = readColor("--accent-11");
  const WHITE = readColor("--neutral-12");
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");

  const pointer = { x: -9999, y: -9999, tx: -9999, ty: -9999, px: -9999, py: -9999, active: false, speed: 0 };
  let width = 0;
  let height = 0;
  let dots: Dot[] = [];
  let particles: Particle[] = [];
  let place: SymbolPlace = { x: 0, y: 0, size: 1 };
  let baseSize = 1;
  let boxWidth = 0;
  let boxHeight = 0;
  let frameId = 0;
  let last = performance.now();

  function layout() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    width = innerWidth;
    height = innerHeight;
    gridCanvas.width = width * dpr;
    gridCanvas.height = height * dpr;
    gridContext!.setTransform(dpr, 0, 0, dpr, 0, 0);
    dots = [];
    for (let y = GRID / 2; y < height + GRID; y += GRID) {
      for (let x = GRID / 2; x < width + GRID; x += GRID) dots.push({ x, y, s: 0 });
    }

    const box = symbolCanvas.getBoundingClientRect();
    boxWidth = box.width;
    boxHeight = box.height;
    symbolCanvas.width = box.width * dpr;
    symbolCanvas.height = box.height * dpr;
    symbolContext!.setTransform(dpr, 0, 0, dpr, 0, 0);
    place = placeSymbol(boxWidth, boxHeight);
    baseSize = place.size;
    const step = place.size / 115;
    particles = [];
    for (let v = 0; v <= 100; v += 100 / 115) {
      for (let u = 0; u <= 100; u += 100 / 115) {
        if (!inSymbol(u, v)) continue;
        // The columns have depth, so the points spread a little in z.
        const z = (Math.random() - 0.5) * 0.5;
        const hx = (u / 100 - 0.5) * place.size + (Math.random() - 0.5) * step * 0.9;
        const hy = (v / 100 - 0.5) * place.size + (Math.random() - 0.5) * step * 0.9;
        // They start scattered and gather into the symbol in the first seconds.
        particles.push({
          hx,
          hy,
          hz: z * place.size * 0.25,
          x: place.x + hx + (Math.random() - 0.5) * place.size * 1.6,
          y: place.y + hy + (Math.random() - 0.5) * place.size * 1.6,
          vx: 0,
          vy: 0,
          seed: Math.random(),
          s: 0,
        });
      }
    }
  }

  function haloFactor(x: number, y: number, rects: DOMRect[]) {
    let factor = 1;
    for (const r of rects) {
      const dx = Math.max(r.left - x, 0, x - r.right);
      const dy = Math.max(r.top - y, 0, y - r.bottom);
      factor = Math.min(factor, smooth(Math.hypot(dx, dy) / HALO));
    }
    return factor;
  }

  function frame(now: number) {
    const dt = Math.min((now - last) / 16.67, 3);
    last = now;
    pointer.x += (pointer.tx - pointer.x) * 0.3 * dt;
    pointer.y += (pointer.ty - pointer.y) * 0.3 * dt;
    const moved = Math.hypot(pointer.tx - pointer.px, pointer.ty - pointer.py);
    pointer.speed += (Math.min(moved / 12, 1) - pointer.speed) * 0.2;
    pointer.px = pointer.tx;
    pointer.py = pointer.ty;
    const rects = haloElements().map((element) => element.getBoundingClientRect());

    // 1. The page dot grid.
    const g = gridContext!;
    g.clearRect(0, 0, width, height);
    for (const d of dots) {
      const halo = haloFactor(d.x, d.y, rects);
      if (halo <= 0.01) continue;
      const dx = d.x - pointer.x;
      const dy = d.y - pointer.y;
      const dist = Math.hypot(dx, dy);
      const target = pointer.active ? smooth(1 - dist / RADIUS) : 0;
      d.s += (target - d.s) * 0.18 * dt;
      const nx = dist ? dx / dist : 0;
      const ny = dist ? dy / dist : 0;
      g.globalAlpha = halo;
      g.fillStyle = mix(DOT, ACCENT, d.s * TINT);
      g.beginPath();
      g.arc(d.x + nx * d.s * PUSH, d.y + ny * d.s * PUSH, DOT_SIZE + d.s * GROWTH, 0, Math.PI * 2);
      g.fill();
    }
    g.globalAlpha = 1;

    // 2. The symbol.
    const s = symbolContext!;
    const box = symbolCanvas.getBoundingClientRect();
    place = placeSymbol(boxWidth, boxHeight);
    const scale = place.size / baseSize;
    const t = now / 1000;
    const angle = Math.sin(t * 0.25) * 0.38;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const gazeX = pointer.active ? (pointer.tx / width - 0.5) * -24 : 0;
    const gazeY = pointer.active ? (pointer.ty / height - 0.5) * -16 : 0;
    const mx = pointer.x - box.left;
    const my = pointer.y - box.top;
    const dotScale = Math.max(place.size, baseSize * 0.75) / 700;
    s.clearRect(0, 0, boxWidth, boxHeight);
    for (const p of particles) {
      const rx = p.hx * cos + p.hz * sin;
      const rz = -p.hx * sin + p.hz * cos;
      const perspective = 900 / (900 + rz);
      const breathe = 1 + Math.sin(t * 0.9 + p.seed * 6) * 0.006;
      const homeX = place.x + rx * perspective * breathe * scale + gazeX;
      const homeY = place.y + p.hy * perspective * breathe * scale + gazeY;
      p.vx += (homeX - p.x) * 0.018 * dt;
      p.vy += (homeY - p.y) * 0.018 * dt;

      let lit = 0;
      const dx = p.x - mx;
      const dy = p.y - my;
      const dist = Math.hypot(dx, dy);
      const reach = RADIUS * 1.5;
      if (pointer.active && dist < reach) {
        const force = (1 - dist / reach) * (0.6 + pointer.speed * 1.4);
        const nx = dx / (dist || 1);
        const ny = dy / (dist || 1);
        // Push out and swirl around the cursor, like a fluid.
        p.vx += (nx * 1.4 - ny * 1.6) * force * dt;
        p.vy += (ny * 1.4 + nx * 1.6) * force * dt;
        lit = Math.min(1, force);
      }
      p.vx *= 0.88;
      p.vy *= 0.88;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.s += (lit - p.s) * 0.1 * dt;

      const depth = Math.min(1, Math.max(0, (perspective - 0.85) / 0.3));
      const sparkle = p.seed > 0.965 ? 0.5 + 0.5 * Math.sin(t * 3.2 + p.seed * 50) : 0;
      s.globalAlpha = Math.min(1, 0.22 + depth * 0.45 + sparkle * 0.4 + p.s * 0.6);
      s.fillStyle = mix(WHITE, ACCENT, Math.min(1, p.s * 1.3 + (p.seed > 0.975 ? 0.7 : 0)));
      s.beginPath();
      s.arc(p.x, p.y, (0.7 + depth * 1.1 + p.s * 1.5) * dotScale, 0, Math.PI * 2);
      s.fill();
    }
    s.globalAlpha = 1;

    if (!reduceMotion.matches) frameId = requestAnimationFrame(frame);
  }

  /** "Reduce motion": the symbol already formed and still; redrawn only when something changes. */
  function still() {
    place = placeSymbol(boxWidth, boxHeight);
    const scale = place.size / baseSize;
    for (const p of particles) {
      p.x = place.x + p.hx * scale;
      p.y = place.y + p.hy * scale;
      p.vx = 0;
      p.vy = 0;
    }
    last = performance.now();
    frame(last);
  }

  function onPointerMove(event: PointerEvent) {
    if (!pointer.active) {
      pointer.x = pointer.px = event.clientX;
      pointer.y = pointer.py = event.clientY;
    }
    pointer.tx = event.clientX;
    pointer.ty = event.clientY;
    pointer.active = !reduceMotion.matches;
  }
  const onPointerLeave = () => {
    pointer.active = false;
  };
  const onResize = () => {
    layout();
    if (reduceMotion.matches) still();
  };
  const onScroll = () => {
    if (reduceMotion.matches) still();
  };
  const onVisibility = () => {
    cancelAnimationFrame(frameId);
    if (!document.hidden && !reduceMotion.matches) {
      last = performance.now();
      frameId = requestAnimationFrame(frame);
    }
  };

  addEventListener("pointermove", onPointerMove, { passive: true });
  document.addEventListener("pointerleave", onPointerLeave);
  addEventListener("resize", onResize);
  addEventListener("scroll", onScroll, { passive: true });
  document.addEventListener("visibilitychange", onVisibility);

  layout();
  if (reduceMotion.matches) still();
  else frameId = requestAnimationFrame(frame);

  return () => {
    cancelAnimationFrame(frameId);
    removeEventListener("pointermove", onPointerMove);
    document.removeEventListener("pointerleave", onPointerLeave);
    removeEventListener("resize", onResize);
    removeEventListener("scroll", onScroll);
    document.removeEventListener("visibilitychange", onVisibility);
  };
}
