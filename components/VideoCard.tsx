"use client";
import { useState, type ReactNode } from "react";

export default function VideoCard({
  src,
  poster,
  className,
  children,
  placeholder,
}: {
  src: string;
  poster?: string;
  className?: string;
  children: ReactNode;
  placeholder: ReactNode;
}) {
  const [playing, setPlaying] = useState(false);

  return (
    <div className={className}>
      {playing ? (
        <video
          src={src}
          poster={poster}
          controls
          autoPlay
          playsInline
          preload="metadata"
          className="w-full aspect-video bg-[#07091F] object-contain"
        />
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          className="block w-full"
          aria-label="Play video"
        >
          {placeholder}
        </button>
      )}
      {children}
    </div>
  );
}