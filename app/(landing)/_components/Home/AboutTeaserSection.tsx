"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Phone, UserPlus, ChevronRight } from "lucide-react";
import { formatPhoneNumber, getTelLink } from "@/lib/utils/phone";

import ParallaxFoam from "./ParallaxFoam";

interface TeaserTextProps {
  text: string;
  startDelay: number;
  animate: boolean;
}

function TeaserText({ text, startDelay, animate }: TeaserTextProps) {
  const words = text.trim().split(/\s+/);
  return (
    <>
      {words.map((word, index) => (
        <span
          key={index}
          className="teaser-word inline-block mr-[0.25em] last:mr-0"
          style={{
            animationDelay: animate ? `${startDelay + index * 0.05}s` : "0s",
          }}
        >
          {word}
        </span>
      ))}
    </>
  );
}

export default function AboutTeaserSection({ phone }: { phone?: string }) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [animate, setAnimate] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 5) {
        setHasScrolled(true);
      } else {
        setHasScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setAnimate(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );
    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }
    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className={`relative w-full bg-white pt-44 pb-36 md:pt-60 md:pb-48 px-6 sm:px-12 md:px-20 overflow-visible ${
        animate ? "animate-in" : ""
      }`}
    >
      {/* Background Foam Shapes */}
      <ParallaxFoam
        src="/landing-page-foams/orange-pyramid-2.webp"
        top="10%"
        left="6%"
        size={50}
        rotate={12}
        speed={0.1}
      />
      <ParallaxFoam
        src="/landing-page-foams/white-cube-2.webp"
        top="35%"
        right="8%"
        size={70}
        blur="sm"
        rotate={-30}
        speed={0.16}
      />
      <ParallaxFoam
        src="/landing-page-foams/white-donut-1.webp"
        top="60%"
        left="4%"
        size={90}
        blur="md"
        rotate={15}
        speed={0.07}
      />
      <ParallaxFoam
        src="/landing-page-foams/orange-cube-1.webp"
        top="80%"
        right="6%"
        size={45}
        rotate={25}
        speed={0.12}
      />
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes teaser-reveal-word {
          from {
            opacity: 0;
            transform: translateY(14px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .teaser-word {
          opacity: 0;
          will-change: transform, opacity;
        }
        .animate-in .teaser-word {
          animation: teaser-reveal-word 1.2s cubic-bezier(0.1, 0.9, 0.2, 1) forwards;
        }
        @keyframes highlight-sweep {
          from {
            transform: scaleX(0);
          }
          to {
            transform: scaleX(1);
          }
        }
        .highlight-sweep {
          transform-origin: left;
          transform: scaleX(0);
          will-change: transform;
        }
        .animate-in .highlight-sweep {
          animation: highlight-sweep 1.0s cubic-bezier(0.1, 0.9, 0.2, 1) forwards;
        }
        @keyframes logo-roll-in {
          from {
            transform: translateX(-60vw) rotate(-360deg);
            opacity: 0;
          }
          to {
            transform: translateX(0) rotate(0deg);
            opacity: 1;
          }
        }
        .logo-roll {
          opacity: 0;
          transform: translateX(-60vw) rotate(-360deg);
          will-change: transform, opacity;
        }
        .animate-in .logo-roll {
          animation: logo-roll-in 1.6s cubic-bezier(0.1, 0.9, 0.2, 1) forwards;
        }
        .clip-slant-left {
          clip-path: none;
        }
        .clip-slant-right {
          clip-path: none;
        }
        @media (min-width: 768px) {
          .clip-slant-left {
            clip-path: polygon(0 0, 100% 0, calc(100% - 24px) 100%, 0 100%);
          }
          .clip-slant-right {
            clip-path: polygon(24px 0, 100% 0, 100% 100%, 0 100%);
          }
        }
      `,
        }}
      />

      {/* Floating Action Bar overlapping the boundary line — Slanted Diagonal Split Card */}
      <div
        className="absolute top-0 left-1/2 z-20 w-[92%] max-w-4xl bg-white shadow-2xl flex flex-col md:flex-row items-stretch rounded-2xl overflow-hidden p-[1px]"
        style={{
          transform: `translate(-50%, ${hasScrolled ? "-40%" : "calc(-40% + 12px)"})`,
          opacity: hasScrolled ? 1 : 0,
          pointerEvents: hasScrolled ? "auto" : "none",
          transition:
            "transform 350ms cubic-bezier(0.16, 1, 0.3, 1), opacity 350ms cubic-bezier(0.16, 1, 0.3, 1)",
          willChange: "transform, opacity",
        }}
      >
        {/* Border overlay to prevent clipping on some browsers/corners */}
        <div className="absolute inset-0 rounded-2xl border border-white/25 pointer-events-none z-30" />

        {/* Left: Register Block */}
        <Link
          href="/register"
          className="clip-slant-left relative overflow-hidden flex-[1.2] flex items-center justify-center gap-4 sm:gap-5 py-6 pl-6 sm:pl-10 pr-12 bg-gradient-to-r from-[#f16d28] to-[#ff7324] text-white cursor-pointer select-none group"
        >
          {/* Subtle Hover Glow */}
          <div className="absolute inset-0 bg-white/[0.04] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

          {/* White Circle Icon Container */}
          <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-white flex items-center justify-center shrink-0 shadow-md transition-transform duration-300 group-hover:scale-105">
            <UserPlus className="h-6 w-6 sm:h-7 sm:w-7 text-[#f16d28]" />
          </div>

          <div className="flex flex-col text-left">
            <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em] text-white/80">
              Ready to Join?
            </span>
            <span className="text-lg sm:text-xl md:text-[22px] font-black tracking-wider uppercase flex items-center mt-0.5">
              Register Now
              <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6 text-white ml-2 transition-transform duration-200 group-hover:translate-x-1" />
            </span>
          </div>
        </Link>

        {/* Right: Call Us Block */}
        <a
          href={phone ? getTelLink(phone) : "#"}
          className="clip-slant-right relative overflow-hidden flex-1 flex items-center justify-center gap-4 sm:gap-5 py-6 pl-8 sm:pl-12 pr-6 sm:pr-10 bg-[#121214] hover:bg-[#18181b] transition-colors duration-300 group text-white cursor-pointer select-none border-t border-zinc-800 md:border-t-0 md:-ml-[22px]"
        >
          {/* Subtle Hover Glow */}
          <div className="absolute inset-0 bg-white/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

          {/* Orange Outline Circle Icon Container */}
          <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full border border-brand-orange-500/80 flex items-center justify-center shrink-0 transition-all duration-300 group-hover:scale-105 group-hover:border-brand-orange-500 group-hover:rotate-12">
            <Phone className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
          </div>

          <div className="flex flex-col text-left">
            <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
              Call Us
            </span>
            <span className="text-base sm:text-lg md:text-xl font-bold tracking-wide mt-0.5 text-white">
              {phone ? formatPhoneNumber(phone) : "Contact Us"}
            </span>
          </div>
        </a>
      </div>

      <div className="relative max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
        {/* Left Column — Logo (Coin rolling animation) */}
        <div className="lg:col-span-4 flex justify-center lg:justify-start">
          <div className="logo-roll relative h-40 w-40 sm:h-48 sm:w-48 md:h-56 md:w-56 flex items-center justify-center">
            <img
              src="/icons/logo.webp"
              alt="TAG Logo"
              className="h-full w-full object-contain"
            />
          </div>
        </div>

        {/* Right Column — Text (Word-by-word reveal animation) */}
        <div className="lg:col-span-8 text-center lg:text-left">
          <p className="text-zinc-900 text-2xl sm:text-3xl md:text-4xl lg:text-[2.5rem] font-light tracking-tight leading-relaxed lg:leading-[1.35] text-balance">
            <TeaserText
              text="We combine a state-of-the-art facility with a"
              startDelay={0.1}
              animate={animate}
            />{" "}
            <span className="relative inline-block font-normal text-zinc-950">
              <TeaserText
                text="structured, level-based curriculum"
                startDelay={0.5}
                animate={animate}
              />
              <span
                className="highlight-sweep absolute bottom-1.5 left-0 right-0 h-[30%] bg-brand-orange-500/20 -z-10"
                style={{
                  animationDelay: "0.5s",
                }}
              />
            </span>{" "}
            <TeaserText
              text="that takes athletes from basic foundations to national-level competitive routines."
              startDelay={0.65}
              animate={animate}
            />
          </p>
        </div>
      </div>
    </section>
  );
}
