"use client";

import React, { useEffect, useState, useRef } from "react";

interface ParallaxFoamProps {
  src: string;
  top: string;
  left?: string;
  right?: string;
  size?: number;
  blur?: "none" | "sm" | "md" | "lg";
  rotate?: number;
  speed?: number; // 0.1 means scrolls 10% slower, 0.2 means 20% slower, etc.
  className?: string;
  zIndex?: number;
}

export default function ParallaxFoam({
  src,
  top,
  left,
  right,
  size = 60,
  blur = "none",
  rotate = 0,
  speed = 0.15,
  className = "",
  zIndex = 0,
}: ParallaxFoamProps) {
  const [offsetY, setOffsetY] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      
      // Calculate scroll offset relative to the viewport height center
      const elementCenter = rect.top + rect.height / 2;
      const distanceFromCenter = elementCenter - viewportHeight / 2;
      
      setOffsetY(distanceFromCenter * speed);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });
    
    // Initial call to set correct position on load
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [speed]);

  const blurClass = {
    none: "",
    sm: "blur-[1px]",
    md: "blur-[2px]",
    lg: "blur-[4.5px]",
  }[blur];

  return (
    <div
      ref={ref}
      className={`absolute pointer-events-none select-none overflow-hidden ${className}`}
      style={{
        top,
        left,
        right,
        width: `${size}px`,
        height: `${size}px`,
        transform: `translateY(${offsetY}px) rotate(${rotate}deg)`,
        zIndex,
        willChange: "transform",
      }}
    >
      <img
        src={src}
        alt="Gymnastics Foam"
        className={`w-full h-full object-contain ${blurClass}`}
        loading="lazy"
      />
    </div>
  );
}
