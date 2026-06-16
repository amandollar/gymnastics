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
  const [hasSize, setHasSize] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (el.getBoundingClientRect().width > 0) {
      setHasSize(true);
      return;
    }

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          setHasSize(true);
          observer.disconnect();
        }
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="w-full min-w-0"
      style={{ height, minHeight: height }}
    >
      {hasSize && (
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      )}
    </div>
  );
}
