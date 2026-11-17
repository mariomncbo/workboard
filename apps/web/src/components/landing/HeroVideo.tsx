"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { cx } from "@/lib/cx";
import styles from "./landing.module.css";

/**
 * The app window with the looping video of a board. It plays muted and in a loop; with
 * "Reduce motion" it stays on its first frame with a button to play it.
 */
export function HeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");
    if (!reduceMotion.matches) {
      void video.play().catch(() => {
        // Autoplay blocked: the play button stays visible.
      });
    }
  }, []);

  function togglePlayback() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) void video.play();
    else video.pause();
  }

  return (
    <div className={styles.window} data-halo>
      <div className={styles.titlebar} aria-hidden="true">
        <i className={styles.trafficRed} />
        <i className={styles.trafficYellow} />
        <i className={styles.trafficGreen} />
        <span>Lanzamiento v2</span>
      </div>
      <div className={styles.videoBox}>
        <video
          ref={videoRef}
          className={styles.video}
          muted
          loop
          playsInline
          preload="metadata"
          poster="/landing/hero-poster.jpg"
          aria-label="WorkBoard en marcha: se crea una lista, se añaden tareas, se arrastran entre listas, se cambia un color y se deshace con ⌘Z"
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        >
          <source src="/landing/hero.mp4" type="video/mp4" />
          <source src="/landing/hero.webm" type="video/webm" />
        </video>
        <button
          type="button"
          className={cx(styles.playButton, isPlaying && styles.playButtonHidden)}
          onClick={togglePlayback}
          aria-label={isPlaying ? "Pausar el vídeo" : "Reproducir el vídeo"}
        >
          <Icon name={isPlaying ? "pause" : "play"} size={16} />
        </button>
      </div>
    </div>
  );
}
