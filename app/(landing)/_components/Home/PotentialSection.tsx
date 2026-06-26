"use client";

import React, { useEffect, useRef, useState } from "react";
import { Aclonica } from "next/font/google";
import { Check } from "lucide-react";
import ParallaxFoam from "./ParallaxFoam";

const features = [
  "Fully Air-Conditioned Facility",
  "Safe & Child-Friendly Environment",
  "Qualified & Experienced Coaches",
  "Professional Training Program",
  "Structured Level-Based Curriculum",
  "Grassroot-Level Gymnastics Equipment",
  "Small Batch Sizes",
  "Individual Attention for Every Child",
  "Focus on Strength, Flexibility & Coordination",
  "Confidence & Character Development",
  "Progressive Skill Assessment",
  "Clean & Hygienic Training Environment",
  "Convenient Community Locations",
  "Fun, Engaging & Motivating Sessions",
  "Trusted by Parents",
];

const aclonica = Aclonica({
  subsets: ["latin"],
  weight: ["400"],
});

interface CounterProps {
  value: number;
  suffix?: string;
  startTrigger: boolean;
  duration?: number;
}

function Counter({
  value,
  suffix = "",
  startTrigger,
  duration = 1200,
}: CounterProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!startTrigger) return;

    let start = 0;
    const end = value;
    if (start === end) {
      setCount(end);
      return;
    }

    const incrementTime = 16; // ~60fps updates
    const totalSteps = duration / incrementTime;
    const stepSize = end / totalSteps;

    const timer = setInterval(() => {
      start += stepSize;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, incrementTime);

    return () => clearInterval(timer);
  }, [value, startTrigger, duration]);

  // Format numbers with commas
  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  return (
    <span>
      {formatNumber(count)}
      {suffix}
    </span>
  );
}

interface StatsBlockProps {
  animate: boolean;
  className?: string;
}

function StatsBlock({ animate, className = "" }: StatsBlockProps) {
  return (
    <div
      className={`grid grid-cols-3 border border-zinc-200 rounded-none divide-x divide-zinc-200 bg-white shadow-md overflow-hidden ${className}`}
    >
      {/* Cell 1: Programs */}
      <div className="flex flex-col items-start justify-center p-3 sm:p-4 md:p-5 text-left transition-all duration-300 hover:bg-zinc-50">
        <span className="text-3xl sm:text-4xl md:text-5xl font-black text-zinc-950 leading-none tracking-tight">
          <Counter value={4} startTrigger={animate} />
        </span>
        <span className="text-[7.5px] sm:text-[8.5px] md:text-[9.5px] font-extrabold text-zinc-500 uppercase tracking-widest mt-1.5 sm:mt-2.5 whitespace-nowrap">
          Competitive Programs
        </span>
      </div>

      {/* Cell 2: Classes */}
      <div className="flex flex-col items-start justify-center p-3 sm:p-4 md:p-5 text-left transition-all duration-300 hover:bg-zinc-50">
        <span className="text-3xl sm:text-4xl md:text-5xl font-black text-zinc-950 leading-none tracking-tight">
          <Counter value={200} suffix="+" startTrigger={animate} />
        </span>
        <span className="text-[7.5px] sm:text-[8.5px] md:text-[9.5px] font-extrabold text-zinc-500 uppercase tracking-widest mt-1.5 sm:mt-2.5 whitespace-nowrap">
          Classes Every Week
        </span>
      </div>

      {/* Cell 3: Space */}
      <div className="flex flex-col items-start justify-center p-3 sm:p-4 md:p-5 text-left transition-all duration-300 hover:bg-zinc-50">
        <span className="text-3xl sm:text-4xl md:text-5xl font-black text-zinc-950 leading-none tracking-tight">
          <Counter value={30000} startTrigger={animate} />
        </span>
        <span className="text-[7.5px] sm:text-[8.5px] md:text-[9.5px] font-extrabold text-zinc-500 uppercase tracking-widest mt-1.5 sm:mt-2.5 whitespace-nowrap">
          SQ Feet Space
        </span>
      </div>
    </div>
  );
}

interface AnimatedLineProps {
  text: string;
  startIndex: number;
  animate: boolean;
  className?: string;
}

function AnimatedLine({
  text,
  startIndex,
  animate,
  className = "",
}: AnimatedLineProps) {
  const chars = text.split("");
  return (
    <span
      className={`block overflow-hidden pt-4 px-4 -mt-4 -mx-4 pb-[2px] ${className}`}
    >
      {chars.map((char, index) => {
        const globalIndex = startIndex + index;
        const delay = 0.1 + globalIndex * 0.018;
        return (
          <span
            key={index}
            className="inline-block reveal-letter"
            style={{
              animationDelay: animate ? `${delay}s` : "0s",
            }}
          >
            {char === " " ? "\u00A0" : char}
          </span>
        );
      })}
    </span>
  );
}

export default function PotentialSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [animateSection, setAnimateSection] = useState(false);
  const [animateDigits, setAnimateDigits] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const sectionObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setAnimateSection(true);
          sectionObserver.unobserve(entry.target);
        }
      },
      { threshold: 0.2 },
    );

    const digitsObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setAnimateDigits(true);
          digitsObserver.unobserve(entry.target);
        }
      },
      { threshold: 0.95 },
    );

    if (containerRef.current) {
      sectionObserver.observe(containerRef.current);
      digitsObserver.observe(containerRef.current);
    }

    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      // Start of transition: when the section top is at the bottom of the screen
      const start = windowHeight;
      // End of transition: when the section top is at the top of the screen (or above)
      const end = 0;

      if (rect.top >= start) {
        setScrollProgress(0);
      } else if (rect.top <= end) {
        setScrollProgress(1);
      } else {
        const progress = (start - rect.top) / (start - end);
        setScrollProgress(Math.min(Math.max(progress, 0), 1));
      }
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });

    return () => {
      sectionObserver.disconnect();
      digitsObserver.disconnect();
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  return (
    <section
      ref={containerRef}
      className={`relative w-full bg-white overflow-hidden potential-section flex flex-col justify-between ${
        animateSection ? "animate-in" : ""
      }`}
    >
      {/* Background Foam Shapes */}
      <ParallaxFoam
        src="/landing-page-foams/white-donut-1.webp"
        top="10%"
        left="10%"
        size={90}
        blur="md"
        rotate={30}
        speed={0.08}
        zIndex={1}
      />
      <ParallaxFoam
        src="/landing-page-foams/orange-cube-1.webp"
        top="35%"
        left="5%"
        size={45}
        rotate={-25}
        speed={0.12}
        zIndex={1}
      />
      <ParallaxFoam
        src="/landing-page-foams/white-pyramid-2.webp"
        top="55%"
        left="15%"
        size={65}
        blur="sm"
        rotate={10}
        speed={0.15}
        zIndex={1}
      />
      <ParallaxFoam
        src="/landing-page-foams/white-cube-1.webp"
        top="80%"
        left="8%"
        size={35}
        rotate={45}
        speed={0.1}
        zIndex={1}
      />
      <ParallaxFoam
        src="/landing-page-foams/orange-pyramid-3.webp"
        top="85%"
        left="45%"
        size={50}
        rotate={-15}
        speed={0.14}
        zIndex={1}
      />
      <ParallaxFoam
        src="/landing-page-foams/white-pyramid-1.webp"
        top="12%"
        right="10%"
        size={60}
        rotate={15}
        speed={0.09}
        zIndex={1}
      />
      <ParallaxFoam
        src="/landing-page-foams/orange-donut-1.webp"
        top="45%"
        right="8%"
        size={75}
        rotate={-45}
        speed={0.11}
        zIndex={1}
      />
      <ParallaxFoam
        src="/landing-page-foams/white-cube-2.webp"
        top="75%"
        right="12%"
        size={80}
        blur="sm"
        rotate={20}
        speed={0.13}
        zIndex={1}
      />
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes fade-slide-up {
              from {
                opacity: 0;
                transform: translateY(30px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
            .animate-in .fade-item {
              animation: fade-slide-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            }
            .fade-item {
              opacity: 0;
              will-change: transform, opacity;
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
            .reveal-letter {
              display: inline-block;
              transform: translateY(115%);
              opacity: 0;
              will-change: transform, opacity;
            }
            .reveal-active .reveal-letter {
              animation: letter-reveal 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            }
            @media (min-width: 640px) {
              .potential-section {
                height: calc(100vh - 64px - 10px);
                min-height: 600px;
              }
            }
            @media (max-width: 639px) {
              .potential-section {
                height: 75vh;
                min-height: 480px;
              }
            }
          `,
        }}
      />

      {/* Main Content Area (100% height of section on desktop, holds content & absolute elements) */}
      <div className="relative w-full flex-1 flex items-center justify-center px-6 sm:px-12 md:px-20 py-16 sm:py-0 potential-main-content">

        {/* Bottom Left Image — Bar Equipment (Static, no fade-up, aligned to bottom-left edge) */}
        <div className="absolute left-0 bottom-0 w-[50vw] md:w-[30vw] portrait:w-[50vw] h-[50%] z-10 overflow-hidden rounded-[1.5rem] flex items-end justify-start opacity-15 md:opacity-100">
          <img
            src="/images/bar-equipment.webp"
            alt="Bar Equipment"
            className="w-full h-auto max-h-full object-contain select-none pointer-events-none"
          />
        </div>

        {/* Top Right Image — Boy Doing Bar Move (Scroll-linked horizontal slide, no fade-up, shifted 20% off-screen on mobile) */}
        <div
          className="absolute right-0 top-0 w-[70vw] md:w-[40vw] portrait:w-[70vw] h-[50%] z-10 overflow-hidden rounded-[1.5rem] flex items-start justify-end translate-x-[calc(20%+var(--scroll-offset))] sm:translate-x-[var(--scroll-offset)] will-change-transform"
          style={
            {
              "--scroll-offset": `${(1 - scrollProgress) * 180}px`,
            } as React.CSSProperties
          }
        >
          <img
            src="/images/boy-doing-bar-move.webp"
            alt="Gymnast Boy Doing Bar Move"
            className="w-full h-auto max-h-full object-contain select-none pointer-events-none"
          />
        </div>

        {/* Top-Left Title Container */}
        <div className="max-w-2xl px-4 pt-0 pb-8 z-20 flex flex-col absolute top-8 left-6 sm:top-12 sm:left-12 lg:top-16 lg:left-20 items-start justify-start text-left sm:mb-0">
          {/* Title (Aclonica font, left-aligned, "Why Choose" on line 1 and "Us?" on line 2 on desktop, single words stacked on mobile) */}
          <div className="relative mb-0 sm:mb-12 text-left">
            {/* Background Shadow Glow Layer (transparent text with white shadow) */}
            <h2
              className={`${aclonica.className} text-4xl sm:text-[7vw] lg:text-[6vw] 2xl:text-[5vw] font-normal text-transparent tracking-tight leading-[1.1] flex flex-col items-start gap-1 absolute inset-0 pointer-events-none select-none transition-opacity duration-1000 ${
                animateSection ? "opacity-100" : "opacity-0"
              }`}
              style={{
                textShadow:
                  "0 0 8px rgba(255, 255, 255, 1), 0 0 20px rgba(255, 255, 255, 1), 0 0 35px rgba(255, 255, 255, 0.95), 0 0 50px rgba(255, 255, 255, 0.9), 0 0 70px rgba(255, 255, 255, 0.8)",
              }}
            >
              <div className="flex flex-col sm:flex-row items-start gap-1 sm:gap-[0.25em]">
                <span className="block pt-4 px-4 -mt-4 -mx-4 pb-[2px]">
                  Why
                </span>
                <span className="block pt-4 px-4 -mt-4 -mx-4 pb-[2px]">
                  Choose
                </span>
              </div>
              <span className="block pt-4 px-4 -mt-4 -mx-4 pb-[2px]">Us?</span>
            </h2>

            {/* Foreground Animated Letters (sharp text, no shadow) */}
            <h2
              className={`${aclonica.className} text-4xl sm:text-[7vw] lg:text-[6vw] 2xl:text-[5vw] font-normal text-zinc-950 tracking-tight leading-[1.1] flex flex-col items-start gap-1 relative z-10 ${
                animateSection ? "reveal-active" : ""
              }`}
              style={{ textShadow: "none" }}
            >
              <div className="flex flex-col sm:flex-row items-start gap-1 sm:gap-[0.25em]">
                <AnimatedLine
                  text="Why"
                  startIndex={0}
                  animate={animateSection}
                />
                <AnimatedLine
                  text="Choose"
                  startIndex={4}
                  animate={animateSection}
                />
              </div>
              <AnimatedLine
                text="Us?"
                startIndex={11}
                animate={animateSection}
                className="text-brand-orange-500"
              />
            </h2>
          </div>
        </div>

        {/* Center-Aligned Features List (Why Choose Us bullet points) */}
        <div className="absolute left-1/2 -translate-x-1/2 top-[55%] sm:top-1/2 -translate-y-1/2 z-20 w-full max-w-2xl lg:max-w-3xl xl:max-w-4xl px-6 sm:px-0 lg:pl-[150px] lg:pt-[100px]">
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:gap-x-6 sm:gap-y-3 lg:gap-x-8 lg:gap-y-4 w-full text-left fade-item">
            {features.map((feature, i) => (
              <div key={i} className="flex items-start gap-2 sm:gap-2.5">
                <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5 xl:w-6 xl:h-6 text-brand-orange-500 shrink-0 mt-0.5 lg:mt-1" />
                <span className="text-zinc-700 text-[10px] sm:text-xs md:text-sm lg:text-base xl:text-lg font-medium leading-snug break-words">
                  {feature}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Desktop Stats Cards (Visible on desktop/tablet only, absolute positioned in bottom-right corner) */}
        <StatsBlock
          animate={animateDigits}
          className="hidden sm:grid absolute right-8 bottom-8 z-20 w-[420px] md:w-[480px] lg:w-[540px] fade-item"
        />
      </div>

      {/* Mobile Stats Row (Visible on mobile only, flows naturally below content in layout flow) */}
      <div className="sm:hidden w-full px-4 pt-4 pb-6 bg-transparent z-20">
        <StatsBlock animate={animateDigits} className="w-full" />
      </div>
    </section>
  );
}
