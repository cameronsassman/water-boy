"use client";
import { useEffect, useState } from "react";

type Slide = { src: string; alt: string };

export default function SvgSlider({
  slides,
  intervalMs = 5000,
}: {
  slides: Slide[];
  intervalMs?: number;
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = slides.length;

  useEffect(() => {
    if (paused || count < 2) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % count), intervalMs);
    return () => clearInterval(t);
  }, [paused, count, intervalMs]);

  const go = (n: number) => setIndex((n + count) % count);

  return (
    <div
      className="relative mx-auto h-[75vh] max-h-[900px] min-h-[420px] max-w-full aspect-[210/297] overflow-hidden rounded-3xl border border-[#CFE6F8] bg-white shadow-sm"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
    >
      <div
        className="flex h-full transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {slides.map((s, i) => (
          <img
            key={s.src}
            src={s.src}
            alt={s.alt}
            loading={i === 0 ? "eager" : "lazy"}
            className="w-full h-full shrink-0 object-contain"
            aria-hidden={i !== index}
          />
        ))}
      </div>

      {count > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(index - 1)}
            aria-label="Previous slide"
            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-[#07091F]/60 text-white hover:bg-[#07091F]/80 transition-colors"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => go(index + 1)}
            aria-label="Next slide"
            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-[#07091F]/60 text-white hover:bg-[#07091F]/80 transition-colors"
          >
            ›
          </button>
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
            {slides.map((s, i) => (
              <button
                key={s.src}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={
                  i === index
                    ? "h-2 w-6 rounded-full bg-[#F5C518] transition-all"
                    : "h-2 w-2 rounded-full bg-white/70 hover:bg-white transition-all"
                }
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}