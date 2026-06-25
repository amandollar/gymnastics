"use client";

import React, { useEffect, useState } from "react";
import { Roboto } from "next/font/google";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["900"],
});

export default function IntroAnimation() {
  const [elapsed, setElapsed] = useState(0);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    let start: number | null = null;
    const totalDuration = 3200; // 1200ms reveal + 300ms hold + 1700ms slide

    const animate = (timestamp: number) => {
      if (!start) start = timestamp;
      const elapsedMs = timestamp - start;
      
      setElapsed(elapsedMs);

      if (elapsedMs < totalDuration) {
        requestAnimationFrame(animate);
      } else {
        setIsDone(true);
      }
    };

    requestAnimationFrame(animate);
  }, []);

  if (isDone) return null;

  // Timings
  const textRevealDuration = 1200;
  const holdDuration = 300;
  const slideStart = textRevealDuration + holdDuration; // 1500ms
  const slideDuration = 1600; // 1.6s to match original curve speed

  // Calculate slide progress (0 to 1)
  let slideProgress = 0;
  if (elapsed > slideStart) {
    const t = Math.min((elapsed - slideStart) / slideDuration, 1);
    // easeOutExpo for the slide-down
    slideProgress = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
  }

  // SVG Path calculation (normalized 0 to 1)
  let yCorners = 0;
  let yControl = 0;

  if (slideProgress < 0.4) {
    const t = slideProgress / 0.4;
    yCorners = 0;
    yControl = t * 0.85;
  } else if (slideProgress < 0.8) {
    const t = (slideProgress - 0.4) / 0.4;
    yCorners = t * 0.65;
    yControl = 0.85 + t * 0.35;
  } else {
    const t = (slideProgress - 0.8) / 0.2;
    yCorners = 0.65 + t * 0.35;
    yControl = 1.20 - t * 0.20;
  }

  const d = `M 0 ${yCorners} Q 0.5 ${yControl} 1 ${yCorners} L 1 1 L 0 1 Z`;

  const lines = ["THE ACADEMY", "OF GYMNASTICS"];

  return (
    <div className="fixed inset-0 w-screen h-screen z-[9999] pointer-events-none select-none">
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes icon-fade {
              from {
                opacity: 0;
              }
              to {
                opacity: 1;
              }
            }
            @keyframes letter-reveal {
              from {
                transform: translateY(115%);
                opacity: 0;
              }
              to {
                transform: translateY(0);
                opacity: 1;
              }
            }
            .reveal-icon {
              display: inline-block;
              opacity: 0;
              will-change: opacity;
              animation: icon-fade 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            }
            .reveal-letter {
              display: inline-block;
              transform: translateY(115%);
              opacity: 0;
              will-change: transform, opacity;
              animation: letter-reveal 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            }
          `,
        }}
      />

      {/* SVG Background Layer */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1 1" preserveAspectRatio="none">
        <defs>
          <clipPath id="preloader-clip" clipPathUnits="objectBoundingBox">
            <path d={d} />
          </clipPath>
        </defs>
        <path d={d} fill="white" />
      </svg>

      {/* Bottom-left aligned overlay clipped by the preloader shape */}
      <div 
        className="absolute inset-0 flex items-end justify-start pointer-events-none pb-16 sm:pb-24 md:pb-[8vh]"
        style={{ 
          clipPath: "url(#preloader-clip)",
          WebkitClipPath: "url(#preloader-clip)"
        }}
      >
        {/* Matches horizontal grid/offset of HeroSection */}
        <div className="w-full max-w-7xl mx-auto px-6 sm:px-12 md:pl-[6vw] md:px-0 md:mx-0 md:max-w-none flex flex-col items-start text-left">
          {/* Preloader Icon */}
          <div className="mb-0">
            <img 
              src="/icons/TAG-preloader-icon.webp" 
              alt="TAG Logo Icon" 
              className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 object-contain select-none pointer-events-none reveal-icon"
              style={{ animationDelay: "0.05s" }}
            />
          </div>

          {/* Text Title in Roboto font split into 2 lines */}
          <h1 className={`${roboto.className} text-zinc-950 font-black text-3xl sm:text-5xl md:text-[6vw] lg:text-[4.5vw] tracking-[0.2em] uppercase leading-[1.05] text-left`}>
            {lines.map((line, lineIndex) => {
              const words = line.split(" ");
              // Calculate character offset from previous lines
              const lineOffset = lines.slice(0, lineIndex).join(" ").length + (lineIndex > 0 ? 1 : 0);
              
              return (
                <span key={lineIndex} className="block mt-0 first:mt-0">
                  {words.map((word, wordIndex) => {
                    const wordOffset = words.slice(0, wordIndex).join(" ").length + (wordIndex > 0 ? 1 : 0);
                    const previousCharsCount = lineOffset + wordOffset;
                    
                    return (
                      <span key={wordIndex} className="inline-flex overflow-hidden pt-2 pb-[4px] -mt-2 mr-[0.35em] last:mr-0">
                        {word.split("").map((char, charIndex) => {
                          const globalIndex = previousCharsCount + charIndex;
                          const delay = 0.12 + globalIndex * 0.018;
                          return (
                            <span
                              key={charIndex}
                              className="inline-block reveal-letter"
                              style={{
                                animationDelay: `${delay}s`,
                              }}
                            >
                              {char}
                            </span>
                          );
                        })}
                      </span>
                    );
                  })}
                </span>
              );
            })}
          </h1>
        </div>
      </div>
    </div>
  );
}
