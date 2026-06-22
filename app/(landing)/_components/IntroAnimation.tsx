"use client";

import React, { useEffect, useState } from "react";

export default function IntroAnimation() {
  const [progress, setProgress] = useState(0);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    let start: number | null = null;
    const duration = 1600; // 1.6s for a smooth, slow-ending reveal

    // easeOutExpo starts instantly and ends very slowly
    const easeOutExpo = (t: number) => {
      return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
    };

    const animate = (timestamp: number) => {
      if (!start) start = timestamp;
      const elapsed = timestamp - start;
      const t = Math.min(elapsed / duration, 1);
      
      setProgress(easeOutExpo(t));

      if (t < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsDone(true);
      }
    };

    requestAnimationFrame(animate);
  }, []);

  if (isDone) return null;

  // Interpolate corners and control point based on progress
  let yCorners = 0;
  let yControl = 0;

  if (progress < 0.4) {
    // Stage 1: Center control point drops to form a deep U-shape drop, corners stay at 0
    const t = progress / 0.4;
    yCorners = 0;
    yControl = t * 85;
  } else if (progress < 0.8) {
    // Stage 2: Corners slide down, control point continues to slide down
    const t = (progress - 0.4) / 0.4;
    yCorners = t * 65;
    yControl = 85 + t * 35;
  } else {
    // Stage 3: Smoothly flatten out at the bottom of the viewport
    const t = (progress - 0.8) / 0.2;
    yCorners = 65 + t * 35;
    yControl = 120 - t * 20;
  }

  const d = `M 0 ${yCorners} Q 50 ${yControl} 100 ${yCorners} L 100 100 L 0 100 Z`;

  return (
    <div className="fixed inset-0 w-screen h-screen z-[9999] pointer-events-none select-none">
      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path d={d} fill="white" />
      </svg>
    </div>
  );
}
