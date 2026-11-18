"use client";

import { useEffect } from "react";

/**
 * Shows the landing's content as it enters the screen: every element with `data-reveal`
 * inside `[data-reveal-root]` rises and fades in once (`data-shown`). An optional
 * `--reveal-delay` staggers the elements of a group.
 *
 * Nothing is hidden until this runs (it sets `data-reveal-ready` on the root), so without
 * JavaScript, or with "Reduce motion", the content is simply there.
 */
export function RevealOnScroll() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>("[data-reveal-root]");
    if (!root || matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const elements = root.querySelectorAll<HTMLElement>("[data-reveal]");
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.setAttribute("data-shown", "");
          observer.unobserve(entry.target);
        }
      },
      // A little before the element is fully on screen, so it never appears too late.
      { rootMargin: "0px 0px -12% 0px" },
    );

    // Whatever is already on screen (a reload halfway down the page) shows straight away.
    for (const element of elements) {
      if (element.getBoundingClientRect().top < innerHeight) element.setAttribute("data-shown", "");
      else observer.observe(element);
    }
    root.setAttribute("data-reveal-ready", "");

    return () => observer.disconnect();
  }, []);

  return null;
}
