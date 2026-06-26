"use client";

import React, { useEffect, useRef, useState } from "react";
import { Aclonica } from "next/font/google";

import ParallaxFoam from "./ParallaxFoam";

const aclonica = Aclonica({ subsets: ["latin"], weight: ["400"] });

const awards = [
  { icon: "🏆", title: "State Championship", subtitle: "Gold Medal — 2023", year: "2023" },
  { icon: "🥇", title: "National Qualifier", subtitle: "Top 3 Finishers — 2022", year: "2022" },
  { icon: "🏅", title: "Best Academy Award", subtitle: "Maharashtra Gymnastics Federation", year: "2021" },
  { icon: "⭐", title: "Excellence in Coaching", subtitle: "SAI Certified Programme", year: "2020" },
  { icon: "🎖️", title: "Youth Development", subtitle: "State Sports Council Recognition", year: "2019" },
];

const testimonials = [
  {
    quote:
      "My daughter joined at age 6 and within a year she was competing at state level. The coaches here are truly exceptional and the facility is world-class.",
    name: "Ruchika Sharma",
    program: "Parent — Artistic Competitive",
    stars: 5,
  },
  {
    quote:
      "I joined as an adult with zero gymnastics experience. The coaches made me feel welcome from day one and I've progressed faster than I ever imagined.",
    name: "Karan Mehta",
    program: "Adult Fitness Program",
    stars: 5,
  },
  {
    quote:
      "The structured curriculum is something else. You can literally see your child progressing level by level — it gives them so much confidence.",
    name: "Priya Nair",
    program: "Parent — Recreational Program",
    stars: 5,
  },
];

export default function AwardsTestimonialsSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [animate, setAnimate] = useState(false);

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
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative w-full bg-white text-zinc-950 pt-24 pb-24 px-4 sm:px-6 md:px-8 border-b border-zinc-100 overflow-hidden"
    >
      {/* Background Foam Shapes */}
      <ParallaxFoam
        src="/landing-page-foams/orange-pyramid-1.webp"
        top="15%"
        left="5%"
        size={45}
        rotate={-20}
        speed={0.16}
      />
      <ParallaxFoam
        src="/landing-page-foams/white-donut-1.webp"
        top="45%"
        right="6%"
        size={85}
        blur="sm"
        rotate={10}
        speed={0.1}
      />
      <ParallaxFoam
        src="/landing-page-foams/white-cube-1.webp"
        top="75%"
        right="8%"
        size={50}
        rotate={30}
        speed={0.14}
      />
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes at-fade-up {
              from { opacity: 0; transform: translateY(24px); }
              to   { opacity: 1; transform: translateY(0); }
            }
            .at-item {
              opacity: 0;
              will-change: transform, opacity;
            }
            .at-animate .at-item {
              animation: at-fade-up 0.9s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            }
          `,
        }}
      />

      {/* ── Awards & Certifications ── */}
      <div className={animate ? "at-animate" : ""}>
        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="at-item" style={{ animationDelay: "0s" }}>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-orange-500 mb-3">
              Recognition
            </p>
            <h2 className={`${aclonica.className} text-4xl sm:text-5xl font-normal tracking-tight leading-[1.1] text-zinc-900 uppercase`}>
              Awards &<br />Certifications
            </h2>
          </div>
          <p className="max-w-sm text-zinc-500 text-sm font-light leading-relaxed at-item" style={{ animationDelay: "0.1s" }}>
            A proud record of achievement recognised by state and national gymnastics governing bodies.
          </p>
        </div>

        {/* Awards Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-20">
          {awards.map((award, i) => (
            <div
              key={award.title}
              className="at-item flex flex-col items-start gap-3 p-5 bg-zinc-50 rounded-2xl border border-zinc-100"
              style={{ animationDelay: `${0.15 + i * 0.08}s` }}
            >
              <span className="text-2xl leading-none">{award.icon}</span>
              <div>
                <p className="text-zinc-900 text-sm font-semibold leading-tight">{award.title}</p>
                <p className="text-zinc-500 text-[11px] font-light mt-1 leading-snug">{award.subtitle}</p>
              </div>
              <span className="mt-auto text-[10px] font-bold uppercase tracking-widest text-brand-orange-500">
                {award.year}
              </span>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="at-item w-full h-px bg-zinc-100 mb-20" style={{ animationDelay: "0.5s" }} />

        {/* ── Testimonials ── */}
        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="at-item" style={{ animationDelay: "0.55s" }}>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-orange-500 mb-3">
              What Athletes Say
            </p>
            <h2 className={`${aclonica.className} text-4xl sm:text-5xl font-normal tracking-tight leading-[1.1] text-zinc-900 uppercase`}>
              Testimonials
            </h2>
          </div>
          <p className="max-w-sm text-zinc-500 text-sm font-light leading-relaxed at-item" style={{ animationDelay: "0.65s" }}>
            Real words from real families who trust us with their athlete's journey.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {testimonials.map((t, i) => (
            <figure
              key={t.name}
              className="at-item flex flex-col bg-zinc-50 rounded-2xl border border-zinc-100 p-6 hover:shadow-md transition-shadow duration-500"
              style={{ animationDelay: `${0.7 + i * 0.1}s` }}
            >
              {/* Stars */}
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: t.stars }).map((_, si) => (
                  <svg key={si} className="w-4 h-4 text-brand-orange-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>

              {/* Quote */}
              <blockquote className="text-zinc-700 text-sm font-light leading-relaxed flex-1 mb-6">
                &ldquo;{t.quote}&rdquo;
              </blockquote>

              {/* Author */}
              <figcaption className="border-t border-zinc-100 pt-4">
                <p className="text-zinc-900 text-sm font-semibold">{t.name}</p>
                <p className="text-zinc-400 text-[11px] font-light mt-0.5">{t.program}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
