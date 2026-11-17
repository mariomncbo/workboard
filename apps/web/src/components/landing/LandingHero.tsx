"use client";

import Link from "next/link";
import { useEffect, useRef, type ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";
import { HeroVideo } from "./HeroVideo";
import { startHeroMotion, type SymbolPlace } from "./heroMotion";
import { DOWNLOAD_URL, HERO } from "./landingCopy";
import styles from "./landing.module.css";

/*
 * The hero. It starts as layout A (the particle symbol huge in the middle, the text at the
 * bottom left and the note at the bottom right). While scrolling, the stage stays fixed and
 * every word slides, in a cascade, to its place in layout B (symbol at the top, text
 * centered, the video window peeking below). Then the page scrolls on as usual.
 *
 * Both layouts are rendered invisibly ("ghosts") with their real styles, and every word is
 * measured in each, so the end is exactly layout B whatever the screen size.
 */

const GROUPS = [
  ["h1", HERO.title],
  ["lead", HERO.lead],
  ["aside", HERO.aside],
  ["note", HERO.note],
] as const;

type Group = (typeof GROUPS)[number][0];

/** The words of a text, each in a span keyed by group and position. */
function Words({ group, text }: { group: Group; text: string }) {
  const words = text.split(" ");
  return words.map((word, index) => (
    <span key={index}>
      <span className={styles.ghostWord} data-key={`${group}-${index}`}>
        {word}
      </span>
      {index < words.length - 1 ? " " : null}
    </span>
  ));
}

function Ctas({ ghost = false }: { ghost?: boolean }): ReactNode {
  const tabIndex = ghost ? -1 : undefined;
  return (
    <>
      <Link className={`${styles.btn} ${styles.btnPrimary}`} href="/registro" tabIndex={tabIndex}>
        Probar en la web
      </Link>
      <a className={`${styles.btn} ${styles.btnGlass}`} href={DOWNLOAD_URL} download tabIndex={tabIndex}>
        <Icon name="download" size={16} /> Descargar para Mac
      </a>
    </>
  );
}

const clamp = (value: number) => Math.min(1, Math.max(0, value));
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

type Spot = { x: number; y: number; k: number };

export function LandingHero() {
  const stageRef = useRef<HTMLElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLCanvasElement>(null);
  const symbolRef = useRef<HTMLCanvasElement>(null);
  const ghostARef = useRef<HTMLDivElement>(null);
  const ghostBRef = useRef<HTMLDivElement>(null);
  const ghostSymbolRef = useRef<HTMLDivElement>(null);
  const ghostCopyBRef = useRef<HTMLDivElement>(null);
  const moversRef = useRef<HTMLDivElement>(null);
  const peekRef = useRef<HTMLElement>(null);
  const cueRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stage = stageRef.current!;
    const sticky = stickyRef.current!;
    const movers = Array.from(moversRef.current!.querySelectorAll<HTMLElement>("[data-key]"));
    const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let spots = new Map<HTMLElement, { a: Spot; b: Spot }>();
    let symbolB: SymbolPlace | null = null;

    const progress = () => {
      const travel = stage.offsetHeight - innerHeight;
      return travel > 0 ? clamp(-stage.getBoundingClientRect().top / travel) : 1;
    };
    const eased = () => (reduceMotion ? (progress() < 0.5 ? 0 : 1) : ease(progress()));

    function layout() {
      const base = sticky.getBoundingClientRect();
      const measure = (ghost: HTMLElement) => {
        const map = new Map<string, { x: number; y: number; font: number }>();
        ghost.querySelectorAll<HTMLElement>("[data-key]").forEach((element) => {
          const rect = element.getBoundingClientRect();
          map.set(element.dataset.key!, {
            x: rect.left - base.left,
            y: rect.top - base.top,
            font: parseFloat(getComputedStyle(element).fontSize),
          });
        });
        return map;
      };
      const a = measure(ghostARef.current!);
      const b = measure(ghostBRef.current!);
      spots = new Map();
      for (const element of movers) {
        const key = element.dataset.key!;
        const spotA = a.get(key);
        const spotB = b.get(key);
        if (!spotA || !spotB) continue;
        // The aside is smaller in A than in B, where it joins the lead: it scales on the way.
        const own = parseFloat(getComputedStyle(element).fontSize) || spotA.font;
        spots.set(element, { a: { x: spotA.x, y: spotA.y, k: spotA.font / own }, b: { x: spotB.x, y: spotB.y, k: spotB.font / own } });
      }
      // The symbol and the window end exactly where layout B puts them.
      const symbolBox = ghostSymbolRef.current!.getBoundingClientRect();
      symbolB = {
        x: symbolBox.width / 2,
        y: symbolBox.top - base.top + symbolBox.height * 0.6,
        size: Math.min(symbolBox.height * 0.95, symbolBox.width * 0.8),
      };
      const copyB = ghostCopyBRef.current!.getBoundingClientRect();
      const travel = stage.offsetHeight - innerHeight;
      peekRef.current!.style.top = `${travel + copyB.bottom - base.top + 40}px`;
      place();
    }

    function place() {
      const raw = progress();
      movers.forEach((element, index) => {
        const spot = spots.get(element);
        if (!spot) return;
        // A small cascade: words set off one after another.
        const k = reduceMotion
          ? raw < 0.5
            ? 0
            : 1
          : ease(clamp((raw - index * 0.004) / (1 - movers.length * 0.004)));
        element.style.transform = `translate(${lerp(spot.a.x, spot.b.x, k)}px, ${lerp(spot.a.y, spot.b.y, k)}px) scale(${lerp(spot.a.k, spot.b.k, k)})`;
      });
      if (cueRef.current) cueRef.current.style.opacity = String(clamp(1 - raw / 0.15));
    }

    const stopMotion = startHeroMotion({
      gridCanvas: gridRef.current!,
      symbolCanvas: symbolRef.current!,
      haloElements: () => Array.from(document.querySelectorAll<HTMLElement>("[data-halo]")),
      placeSymbol: (width, height) => {
        const p = eased();
        const start = { x: width / 2, y: height * 0.44, size: Math.min(height * 0.82, width * 0.9) };
        const end = symbolB ?? start;
        return { x: lerp(start.x, end.x, p), y: lerp(start.y, end.y, p), size: lerp(start.size, end.size, p) };
      },
    });

    addEventListener("scroll", place, { passive: true });
    addEventListener("resize", layout);
    let cancelled = false;
    void document.fonts.ready.then(() => {
      if (!cancelled) layout();
    });
    layout();

    return () => {
      cancelled = true;
      stopMotion();
      removeEventListener("scroll", place);
      removeEventListener("resize", layout);
    };
  }, []);

  return (
    <>
      <canvas ref={gridRef} className={styles.grid} aria-hidden="true" />
      <section ref={stageRef} className={styles.stage} aria-labelledby="hero-title">
        <div ref={stickyRef} className={styles.sticky}>
          <canvas ref={symbolRef} className={styles.symbol} aria-hidden="true" />

          {/* The full text, for screen readers and search engines. The visible words are below. */}
          <h1 id="hero-title" className="visually-hidden">
            {HERO.title}
          </h1>
          <p className="visually-hidden">
            {HERO.lead} {HERO.aside}
          </p>
          <p className="visually-hidden">{HERO.note}</p>

          {/* Layout A, invisible: measured. */}
          <div ref={ghostARef} className={`${styles.ghost} ${styles.ghostA}`} aria-hidden="true">
            <div className={styles.ghostAOverlay}>
              <div className={styles.ghostAMain}>
                <p className={styles.textTitle}>
                  <Words group="h1" text={HERO.title} />
                </p>
                <p className={styles.textLead}>
                  <Words group="lead" text={HERO.lead} />
                </p>
                <div className={styles.ctas} data-key="ctas">
                  <Ctas ghost />
                </div>
              </div>
              <div className={styles.ghostAAside}>
                <p className={styles.textAside}>
                  <Words group="aside" text={HERO.aside} />
                </p>
                <p className={styles.textNote}>
                  <Words group="note" text={HERO.note} />
                </p>
              </div>
            </div>
          </div>

          {/* Layout B, invisible: measured. */}
          <div ref={ghostBRef} className={`${styles.ghost} ${styles.ghostB}`} aria-hidden="true">
            <div ref={ghostSymbolRef} className={styles.ghostBSymbol} />
            <div ref={ghostCopyBRef} className={styles.ghostBCopy}>
              <p className={styles.textTitle}>
                <Words group="h1" text={HERO.title} />
              </p>
              <p className={`${styles.textLead} ${styles.ghostBLead}`}>
                <Words group="lead" text={HERO.lead} /> <Words group="aside" text={HERO.aside} />
              </p>
              <div className={styles.ctas} data-key="ctas">
                <Ctas ghost />
              </div>
              <p className={`${styles.textNote} ${styles.ghostBNote}`}>
                <Words group="note" text={HERO.note} />
              </p>
            </div>
          </div>

          {/* What is seen: every word and the buttons, placed between A and B by the script. */}
          <div ref={moversRef} className={styles.movers}>
            <span aria-hidden="true">
              {GROUPS.map(([group, text]) =>
                text.split(" ").map((word, index) => (
                  <span key={`${group}-${index}`} className={`${styles.mover} ${styles[`mover_${group}`]}`} data-key={`${group}-${index}`}>
                    {word}
                  </span>
                )),
              )}
            </span>
            <div className={`${styles.mover} ${styles.ctas} ${styles.moverCtas}`} data-key="ctas">
              <Ctas />
            </div>
          </div>

          <div ref={cueRef} className={styles.cue} aria-hidden="true">
            Desliza
            <Icon name="chevronDown" size={14} />
          </div>
        </div>

        <figure ref={peekRef} className={styles.peek}>
          <HeroVideo />
        </figure>
      </section>
    </>
  );
}
