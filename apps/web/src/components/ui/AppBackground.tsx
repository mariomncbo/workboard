"use client";

import { useEffect, useRef } from "react";
import styles from "./AppBackground.module.css";

/** Values of the design system (AppBackground component), in CSS pixels. */
const CONFIG = {
  spacing: 20,
  dotRadius: 1,
  cursorRadius: 140,
  growth: 1.4,
  push: 11,
  tint: 0.75,
  waveAmount: 0.25,
  waveSpeed: 0.5,
};
/** Per-frame easing at 60 fps, as in the design reference. */
const POSITION_EASING = 0.15;
const STRENGTH_EASING = 0.08;
/** Resting dots are grouped by wave level so each frame fills a few paths only. */
const WAVE_LEVELS = 12;

type RGB = [number, number, number];

function readColor(name: string): RGB {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const hex = value.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16)) as RGB;
}

/**
 * Animated dot grid behind Login, Register, Home and boards without color. Dots near the
 * pointer grow, move away and take the accent color; a slow diagonal wave changes their
 * size and brightness. Still with "Reduce motion" (the pointer effect still works), and
 * paused while the tab is hidden. Decorative: hidden from assistive technologies.
 */
export function AppBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    const colors = {
      background: readColor("--bg-page"),
      dot: readColor("--backdrop-dot"),
      active: readColor("--backdrop-dot-active"),
    };
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const pointer = { x: -1e4, y: -1e4, targetX: -1e4, targetY: -1e4, strength: 0, targetStrength: 0 };
    let width = 0;
    let height = 0;
    let frame = 0;
    let lastTime: number | null = null;
    const start = performance.now();

    const resize = () => {
      const scale = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * scale;
      canvas.height = height * scale;
      context.setTransform(scale, 0, 0, scale, 0, 0);
    };

    const draw = (time: number) => {
      const [br, bg, bb] = colors.background;
      context.fillStyle = `rgb(${br},${bg},${bb})`;
      context.fillRect(0, 0, width, height);

      const restingDots = Array.from({ length: WAVE_LEVELS }, () => new Path2D());
      const lastLevel = WAVE_LEVELS - 1;

      for (let y = CONFIG.spacing / 2; y < height + CONFIG.spacing; y += CONFIG.spacing) {
        for (let x = CONFIG.spacing / 2; x < width + CONFIG.spacing; x += CONFIG.spacing) {
          const wave = 0.5 + 0.5 * Math.sin((x * 0.8 + y) * 0.01 - time * CONFIG.waveSpeed);
          const dx = x - pointer.x;
          const dy = y - pointer.y;
          const distance = Math.max(Math.hypot(dx, dy), 1);
          const linear = pointer.strength * Math.max(0, 1 - distance / CONFIG.cursorRadius);
          const near = linear * linear * (3 - 2 * linear);

          if (near > 0.001) {
            const offset = (CONFIG.push * near) / distance;
            const radius = CONFIG.dotRadius * (1 + CONFIG.waveAmount * wave) + CONFIG.growth * near;
            const mix = Math.min(1, near * 1.1) * CONFIG.tint;
            const opacity = Math.min(1, 0.7 + 0.3 * Math.max(wave * CONFIG.waveAmount * 2.4, near));
            const [r, g, b] = colors.dot.map((c, i) => Math.round(c + (colors.active[i] - c) * mix));
            context.fillStyle = `rgba(${r},${g},${b},${opacity})`;
            context.beginPath();
            context.arc(x + dx * offset, y + dy * offset, radius, 0, Math.PI * 2);
            context.fill();
          } else {
            const level = Math.round(wave * lastLevel);
            const radius = CONFIG.dotRadius * (1 + (CONFIG.waveAmount * level) / lastLevel);
            restingDots[level].moveTo(x + radius, y);
            restingDots[level].arc(x, y, radius, 0, Math.PI * 2);
          }
        }
      }

      const [dr, dg, db] = colors.dot;
      restingDots.forEach((path, level) => {
        const opacity = Math.min(1, 0.7 + 0.3 * (level / lastLevel) * CONFIG.waveAmount * 2.4);
        context.fillStyle = `rgba(${dr},${dg},${db},${opacity})`;
        context.fill(path);
      });
    };

    const advancePointer = (now: number) => {
      const frames = lastTime === null ? 60 : Math.min(Math.max(((now - lastTime) / 1000) * 60, 0), 10);
      lastTime = now;
      const move = 1 - Math.pow(1 - POSITION_EASING, frames);
      const fade = 1 - Math.pow(1 - STRENGTH_EASING, frames);
      pointer.x += (pointer.targetX - pointer.x) * move;
      pointer.y += (pointer.targetY - pointer.y) * move;
      pointer.strength += (pointer.targetStrength - pointer.strength) * fade;
    };

    const tick = (now: number) => {
      advancePointer(now);
      draw((now - start) / 1000);
      frame = requestAnimationFrame(tick);
    };

    /** With "Reduce motion": no wave and no easing, redraw only when the pointer moves. */
    const drawStill = () => {
      pointer.x = pointer.targetX;
      pointer.y = pointer.targetY;
      pointer.strength = pointer.targetStrength;
      draw(0);
    };

    const startAnimating = () => {
      cancelAnimationFrame(frame);
      lastTime = null;
      if (reduceMotion.matches) {
        drawStill();
      } else if (!document.hidden) {
        frame = requestAnimationFrame(tick);
      }
    };

    const onPointerMove = (event: PointerEvent) => {
      pointer.targetX = event.clientX;
      pointer.targetY = event.clientY;
      if (pointer.strength < 0.01) {
        pointer.x = pointer.targetX;
        pointer.y = pointer.targetY;
      }
      pointer.targetStrength = 1;
      if (reduceMotion.matches) drawStill();
    };
    const onPointerLeave = () => {
      pointer.targetStrength = 0;
      if (reduceMotion.matches) drawStill();
    };
    const onResize = () => {
      resize();
      if (reduceMotion.matches) drawStill();
    };
    const onVisibilityChange = () => {
      if (document.hidden) cancelAnimationFrame(frame);
      else startAnimating();
    };

    resize();
    startAnimating();
    window.addEventListener("pointermove", onPointerMove);
    document.documentElement.addEventListener("pointerleave", onPointerLeave);
    window.addEventListener("blur", onPointerLeave);
    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVisibilityChange);
    reduceMotion.addEventListener("change", startAnimating);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onPointerMove);
      document.documentElement.removeEventListener("pointerleave", onPointerLeave);
      window.removeEventListener("blur", onPointerLeave);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      reduceMotion.removeEventListener("change", startAnimating);
    };
  }, []);

  return <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />;
}
