"use client";

import { useEffect, useRef, useState } from "react";

// A score that counts up from 0 when it first shows, then glides to each new value as the resume
// changes. People who turn animations off see the number straight away.
export function useCountUp(value: number) {
  const [shown, setShown] = useState(0);
  const from = useRef(0);

  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      from.current = value;
      setShown(value);
      return;
    }
    const start = from.current;
    const duration = 600 + Math.abs(value - start) * 12;
    // Timed from the first frame's own timestamp, so every step uses the same clock
    let began: number | undefined;
    let frame = requestAnimationFrame(function step(now) {
      began ??= now;
      const t = Math.min(1, (now - began) / duration);
      const next = Math.round(start + (value - start) * (1 - (1 - t) ** 3));
      from.current = next;
      setShown(next);
      if (t < 1) frame = requestAnimationFrame(step);
    });
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return shown;
}

// The counting number, as wide as the final one from the start, so "/100" and the text beside it
// stay put while it counts. An invisible copy of the final number (drawn by CSS, so it isn't part
// of the page's text) sits in the same grid cell and sets the width.
export function CountedNumber({ value, shown }: { value: number; shown: number }) {
  return (
    <span
      data-final={value}
      className="inline-grid justify-items-end before:invisible before:col-start-1 before:row-start-1 before:content-[attr(data-final)]"
    >
      <span className="col-start-1 row-start-1">{shown}</span>
    </span>
  );
}
