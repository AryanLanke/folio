"use client";

import { useEffect, useRef, useState } from "react";

// One recording from /videos, in the size closest to the screen's own pixels, since browsers blur
// a video they have to shrink a lot: <name>.mp4 (4K) for wide high-density screens, -1440 for
// laptops scaled 125-175%, and -1080 for everything else, phones included. <name>-poster.webp
// (its first frame, 1920 wide) shows until it plays. It only plays while it's on screen, and not
// before the rest of the page has loaded, so the video never slows down the first view. Hidden
// by CSS, it never plays, so it never loads. Browsers fetch a poster even when the video is
// hidden, so only the default (dark) recording has one from the start; the other gets its
// poster once it shows. People who ask for less motion get the first frame and the player's
// controls, so it only moves if they press play.
function Recording({
  name,
  label,
  className,
  posterFirst,
}: {
  name: string;
  label: string;
  className: string;
  posterFirst: boolean;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [still, setStill] = useState(false);
  const posterUrl = `/videos/${name}-poster.webp`;
  const [poster, setPoster] = useState(posterFirst ? posterUrl : undefined);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const lessMotion = matchMedia("(prefers-reduced-motion: reduce)");
    let onScreen = false;
    let pageLoaded = document.readyState === "complete";
    const update = () => {
      setStill(lessMotion.matches);
      if (lessMotion.matches) return;
      if (onScreen && pageLoaded) video.play().catch(() => {});
      else video.pause();
    };
    const onLoad = () => {
      pageLoaded = true;
      update();
    };
    const observer = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      if (onScreen) setPoster(posterUrl);
      update();
    });
    observer.observe(video);
    lessMotion.addEventListener("change", update);
    if (!pageLoaded) window.addEventListener("load", onLoad, { once: true });
    return () => {
      observer.disconnect();
      lessMotion.removeEventListener("change", update);
      window.removeEventListener("load", onLoad);
    };
  }, [posterUrl]);

  return (
    <video
      ref={ref}
      width={3840}
      height={2160}
      poster={poster}
      preload="none"
      muted
      loop
      playsInline
      controls={still}
      aria-label={label}
      className={`h-auto w-full ${className}`}
    >
      <source src={`/videos/${name}.mp4`} type="video/mp4" media="(min-width: 1024px) and (min-resolution: 2dppx)" />
      <source src={`/videos/${name}-1440.mp4`} type="video/mp4" media="(min-width: 768px) and (min-resolution: 1.2dppx)" />
      <source src={`/videos/${name}-1080.mp4`} type="video/mp4" />
    </video>
  );
}

// A silent, looping screen recording of Folio, recorded in both dark and light mode so it matches
// the page. Only the one for the current mode shows, plays and downloads.
export default function DemoVideo({ name, label }: { name: string; label: string }) {
  return (
    <>
      <Recording name={name} label={label} className="block light:hidden" posterFirst />
      <Recording name={`${name}-light`} label={label} className="hidden light:block" posterFirst={false} />
    </>
  );
}
