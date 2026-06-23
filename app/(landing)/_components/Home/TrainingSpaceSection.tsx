"use client";

import React, { useEffect, useRef, useState } from "react";
import { Aclonica } from "next/font/google";

const aclonica = Aclonica({
  subsets: ["latin"],
  weight: ["400"],
});

export default function TrainingSpaceSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0.5);
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      // Start calculating when the section's top enters the viewport
      const start = windowHeight;
      // End calculating when the section's bottom leaves the viewport
      const end = -rect.height;

      const totalDist = start - end;
      const currentDist = start - rect.top;

      const progress = currentDist / totalDist;
      setScrollProgress(Math.min(Math.max(progress, 0), 1));
    };

    handleResize();
    handleScroll();

    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Parallax offsets based on progress (0 when centered on screen at progress = 0.5)
  // Staggered columns (2 and 4) are configured to scroll the fastest upwards
  const col1Offset = isMobile ? 0 : (scrollProgress - 0.5) * 50;
  const col2Offset = isMobile ? 0 : (scrollProgress - 0.5) * -170;
  const col3Offset = isMobile ? 0 : (scrollProgress - 0.5) * 80;
  const col4Offset = isMobile ? 0 : (scrollProgress - 0.5) * -150;

  return (
    <section
      ref={containerRef}
      className="relative w-full bg-white text-zinc-950 overflow-hidden pt-24 pb-48 md:pb-64 px-4 sm:px-6 md:px-8 border-b border-zinc-200/80"
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .space-card {
              border-radius: 1.5rem;
              transition: border-radius 1.6s cubic-bezier(0.05, 0.9, 0.05, 1), 
                          box-shadow 1.6s cubic-bezier(0.05, 0.9, 0.05, 1), 
                          border-color 1.6s cubic-bezier(0.05, 0.9, 0.05, 1);
              will-change: border-radius, transform;
              isolation: isolate;
              transform: translateZ(0);
              -webkit-mask-image: -webkit-radial-gradient(white, black);
            }
            @media (hover: hover) {
              .space-card {
                border-radius: 16vw;
              }
              @media (min-width: 1536px) {
                .space-card {
                  border-radius: 12vw;
                }
              }
              .space-card:hover {
                border-radius: 24px;
              }
            }
            .space-card-image {
              transition: transform 1.6s cubic-bezier(0.05, 0.9, 0.05, 1);
              will-change: transform;
            }
            .space-card:hover .space-card-image {
              transform: scale(1.025);
            }
          `,
        }}
      />

      <div className="w-full">
        {/* Header (Layout matching the design: Title on left, Description on right) */}
        <div className="mb-20 text-left flex flex-col md:flex-row md:items-start justify-between gap-8 w-full">
          <div className="max-w-xl">
            <h2 className={`${aclonica.className} text-4xl sm:text-5xl md:text-6xl font-normal tracking-tight leading-[1.1] text-zinc-900 uppercase`}>
              Our training<br />space
            </h2>
          </div>
          <div className="max-w-md pt-2 md:pt-4">
            <p className="text-zinc-500 text-sm sm:text-base font-light leading-relaxed">
              A state-of-the-art facility meticulously designed to help athletes unlock their full physical potential and train with absolute precision.
            </p>
          </div>
        </div>

        {/* Mobile Layout (2 columns, 6 images in total, no shifts/offsets) */}
        <div className="grid grid-cols-2 gap-1.5 md:hidden pt-4 w-full">
          <div className="space-card group relative w-full aspect-[4/5] overflow-hidden bg-zinc-50 shadow-2xs hover:shadow-xs">
            <img
              src="/images/gym-floor.png"
              alt="Gymnast main floor"
              className="space-card-image w-full h-full object-cover select-none pointer-events-none"
            />
          </div>
          <div className="space-card group relative w-full aspect-[4/5] overflow-hidden bg-zinc-50 shadow-2xs hover:shadow-xs">
            <img
              src="/images/bar-equipment.webp"
              alt="Gymnast equipment area"
              className="space-card-image w-full h-full object-cover select-none pointer-events-none"
            />
          </div>
          <div className="space-card group relative w-full aspect-[4/5] overflow-hidden bg-zinc-50 shadow-2xs hover:shadow-xs">
            <img
              src="/images/gymnast_potential.png"
              alt="Gymnast training close up"
              className="space-card-image w-full h-full object-cover select-none pointer-events-none"
            />
          </div>
          <div className="space-card group relative w-full aspect-[4/5] overflow-hidden bg-zinc-50 shadow-2xs hover:shadow-xs">
            <img
              src="/images/boy-doing-bar-move.webp"
              alt="Boy doing gymnast routine"
              className="space-card-image w-full h-full object-cover select-none pointer-events-none"
            />
          </div>
          <div className="space-card group relative w-full aspect-[4/5] overflow-hidden bg-zinc-50 shadow-2xs hover:shadow-xs">
            <img
              src="/images/gymnast_strength.png"
              alt="Gymnast strength training area"
              className="space-card-image w-full h-full object-cover select-none pointer-events-none"
            />
          </div>
          <div className="space-card group relative w-full aspect-[4/5] overflow-hidden bg-zinc-50 shadow-2xs hover:shadow-xs">
            <img
              src="/images/gym-floor.png"
              alt="Gymnast vault area"
              className="space-card-image w-full h-full object-cover select-none pointer-events-none"
            />
          </div>
        </div>

        {/* Desktop Layout (3 columns, staggered layout with tiny gaps, 4 columns on 2xl+) */}
        <div className="hidden md:grid grid-cols-3 2xl:grid-cols-4 gap-1.5 md:gap-2 items-start pt-4 w-full">
          
          {/* Column 1 (Slightly faster scroll) */}
          <div
            className="flex flex-col gap-1.5 md:gap-2 will-change-transform transition-transform duration-75 ease-out"
            style={{ transform: `translateY(${col1Offset}px)` }}
          >
            <div className="space-card group relative w-full aspect-[4/5] overflow-hidden bg-zinc-50 shadow-2xs hover:shadow-xs">
              <img
                src="/images/gym-floor.png"
                alt="Gymnast main floor"
                className="space-card-image w-full h-full object-cover select-none pointer-events-none"
              />
            </div>
            <div className="space-card group relative w-full aspect-[4/5] overflow-hidden bg-zinc-50 shadow-2xs hover:shadow-xs">
              <img
                src="/images/bar-equipment.webp"
                alt="Gymnast equipment area"
                className="space-card-image w-full h-full object-cover select-none pointer-events-none"
              />
            </div>
          </div>

          {/* Column 2 (Counter-scroll parallax & initial vertical offset) */}
          <div
            className="flex flex-col gap-1.5 md:gap-2 will-change-transform transition-transform duration-75 ease-out"
            style={{ transform: `translateY(calc(25% + ${col2Offset}px))` }}
          >
            <div className="space-card group relative w-full aspect-[4/5] overflow-hidden bg-zinc-50 shadow-2xs hover:shadow-xs">
              <img
                src="/images/gymnast_potential.png"
                alt="Gymnast training close up"
                className="space-card-image w-full h-full object-cover select-none pointer-events-none"
              />
            </div>
            <div className="space-card group relative w-full aspect-[4/5] overflow-hidden bg-zinc-50 shadow-2xs hover:shadow-xs">
              <img
                src="/images/boy-doing-bar-move.webp"
                alt="Boy doing gymnast routine"
                className="space-card-image w-full h-full object-cover select-none pointer-events-none"
              />
            </div>
          </div>

          {/* Column 3 (Fastest scroll) */}
          <div
            className="flex flex-col gap-1.5 md:gap-2 will-change-transform transition-transform duration-75 ease-out"
            style={{ transform: `translateY(${col3Offset}px)` }}
          >
            <div className="space-card group relative w-full aspect-[4/5] overflow-hidden bg-zinc-50 shadow-2xs hover:shadow-xs">
              <img
                src="/images/gymnast_strength.png"
                alt="Gymnast strength training area"
                className="space-card-image w-full h-full object-cover select-none pointer-events-none"
              />
            </div>
            <div className="space-card group relative w-full aspect-[4/5] overflow-hidden bg-zinc-50 shadow-2xs hover:shadow-xs">
              <img
                src="/images/gym-floor.png"
                alt="Gymnast vault area"
                className="space-card-image w-full h-full object-cover select-none pointer-events-none"
              />
            </div>
          </div>

          {/* Column 4 (Visible only on 2xl+ screens) */}
          <div
            className="hidden 2xl:flex flex-col gap-1.5 md:gap-2 will-change-transform transition-transform duration-75 ease-out"
            style={{ transform: `translateY(calc(25% + ${col4Offset}px))` }}
          >
            <div className="space-card group relative w-full aspect-[4/5] overflow-hidden bg-zinc-50 shadow-2xs hover:shadow-xs">
              <img
                src="/images/bar-equipment.webp"
                alt="Gymnast equipment area 2"
                className="space-card-image w-full h-full object-cover select-none pointer-events-none"
              />
            </div>
            <div className="space-card group relative w-full aspect-[4/5] overflow-hidden bg-zinc-50 shadow-2xs hover:shadow-xs">
              <img
                src="/images/gymnast_potential.png"
                alt="Gymnast training close up 2"
                className="space-card-image w-full h-full object-cover select-none pointer-events-none"
              />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
