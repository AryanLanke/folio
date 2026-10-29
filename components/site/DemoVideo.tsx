"use client";

import { useEffect, useRef, useState } from "react";

// A silent, looping screen recording of Folio from /videos: <name>.mp4 is 4K for wide screens,
// <name>-1080.mp4 is for phones, and <name>-poster.jpg (its first frame) shows until it plays.
// It only plays while it's on screen. People who ask for less motion get the first frame and
// the player's controls, so it only moves if they press play.
export default function DemoVideo({ name, label, eager = false }: { name: string; label: string; eager?: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [still, setStill] = useState(false);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const lessMotion = matchMedia("(prefers-reduced-motion: reduce)");
    let onScreen = false;
    const update = () => {
      setStill(lessMotion.matches);
      if (lessMotion.matches) return;
      if (onScreen) video.play().catch(() => {});
      else video.pause();
    };
    const observer = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      update();
    });
    observer.observe(video);
    lessMotion.addEventListener("change", update);
    return () => {
      observer.disconnect();
      lessMotion.removeEventListener("change", update);
    };
  }, []);

  return (
    <video
      ref={ref}
      width={3840}
      height={2160}
      poster={`/videos/${name}-poster.jpg`}
      preload={eager ? "auto" : "none"}
      muted
      loop
      playsInline
      controls={still}
      aria-label={label}
      className="block h-auto w-full"
    >
      <source src={`/videos/${name}.mp4`} type="video/mp4" media="(min-width: 768px)" />
      <source src={`/videos/${name}-1080.mp4`} type="video/mp4" />
    </video>
  );
}
