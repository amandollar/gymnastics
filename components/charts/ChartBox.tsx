"use client";

import { useEffect, useRef, useState } from "react";
import { ResponsiveContainer } from "recharts";

/**
 * Measures its container and only mounts Recharts when width/height > 0
 * (fixes "width(-1) and height(-1)" warnings in flex/grid layouts).
 */
export default function ChartBox({
  height,
  children,
}: {
  height: number;
  children: React.ReactElement;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ width: number; height: number } | null>(
    null
  );

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const measure = () => {
      const { width, height: h } = el.getBoundingClientRect();
      const w = Math.floor(width);
      const ht = Math.floor(h) || height;
      if (w > 0 && ht > 0) {
        setSize({ width: w, height: ht });
      }
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [height]);

  return (
    <div
      ref={ref}
      className="w-full min-w-0"
      style={{ height, minHeight: height }}
    >
      {size && (
        <ResponsiveContainer width={size.width} height={size.height}>
          {children}
        </ResponsiveContainer>
      )}
    </div>
  );
}
