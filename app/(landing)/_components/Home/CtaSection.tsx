"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Aclonica } from "next/font/google";
import { UserPlus, Phone } from "lucide-react";
import { formatPhoneNumber, getTelLink } from "@/lib/utils/phone";

import ParallaxFoam from "./ParallaxFoam";

const aclonica = Aclonica({ subsets: ["latin"], weight: ["400"] });

export default function CtaSection({ phone }: { phone?: string }) {
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
      { threshold: 0.2 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative w-full bg-[#0a0a0b] text-white overflow-hidden pt-28 pb-28 px-4 sm:px-6 md:px-8"
    >
      {/* Background Foam Shapes */}
      <ParallaxFoam
        src="/landing-page-foams/orange-pyramid-3.webp"
        top="15%"
        left="5%"
        size={50}
        rotate={-15}
        speed={0.15}
      />
      <ParallaxFoam
        src="/landing-page-foams/white-cube-1.webp"
        top="45%"
        right="8%"
        size={65}
        blur="sm"
        rotate={22}
        speed={0.1}
      />
      <ParallaxFoam
        src="/landing-page-foams/white-donut-1.webp"
        top="75%"
        left="7%"
        size={80}
        blur="md"
        rotate={45}
        speed={0.08}
      />
      {/* Decorative orange curved lines (same style as PotentialSection) */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none opacity-20 z-0"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M-100,100 C300,50 500,300 900,80 C1300,-100 1200,500 1600,350"
          fill="none"
          stroke="rgba(241, 109, 40, 0.5)"
          strokeWidth="1.5"
        />
        <path
          d="M-50,250 C400,200 300,450 800,380 C1300,300 1400,650 1800,500"
          fill="none"
          stroke="rgba(241, 109, 40, 0.4)"
          strokeWidth="1.5"
        />
        <path
          d="M-200,350 C200,300 400,600 900,480 C1400,360 1500,750 1900,650"
          fill="none"
          stroke="rgba(241, 109, 40, 0.3)"
          strokeWidth="1"
        />
      </svg>

      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes cta-fade-up {
              from { opacity: 0; transform: translateY(28px); }
              to   { opacity: 1; transform: translateY(0); }
            }
            .cta-item {
              opacity: 0;
              will-change: transform, opacity;
            }
            .cta-animate .cta-item {
              animation: cta-fade-up 1.0s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            }
          `,
        }}
      />

      <div className={`relative z-10 flex flex-col items-center text-center max-w-4xl mx-auto ${animate ? "cta-animate" : ""}`}>
        {/* Overline */}
        <p
          className="cta-item text-[10px] font-bold uppercase tracking-[0.25em] text-brand-orange-500 mb-6"
          style={{ animationDelay: "0s" }}
        >
          Start Your Journey
        </p>

        {/* Heading */}
        <h2
          className={`${aclonica.className} cta-item text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-normal uppercase tracking-tight leading-[1.05] text-white mb-6`}
          style={{ animationDelay: "0.1s" }}
        >
          Ready to Begin<br />Your Journey?
        </h2>

        {/* Subtext */}
        <p
          className="cta-item text-zinc-400 text-base sm:text-lg font-light leading-relaxed max-w-xl mb-12"
          style={{ animationDelay: "0.2s" }}
        >
          Whether you&apos;re enrolling your child or starting gymnastics as an adult — we have a program built for you. Come train with the best.
        </p>

        {/* CTA Buttons */}
        <div
          className="cta-item flex flex-col sm:flex-row items-center justify-center gap-4 w-full"
          style={{ animationDelay: "0.3s" }}
        >
          <Link
            href="/register"
            id="cta-register-btn"
            className="inline-flex items-center justify-center gap-3 px-8 py-4 rounded-full bg-brand-orange-500 hover:bg-brand-orange-600 text-white text-sm font-bold uppercase tracking-wider transition-colors duration-300 w-full sm:w-auto"
          >
            <UserPlus className="w-4 h-4" />
            Register Now
          </Link>
          <a
            href={phone ? getTelLink(phone) : "tel:+919999999999"}
            id="cta-call-btn"
            className="inline-flex items-center justify-center gap-3 px-8 py-4 rounded-full border border-white/20 hover:border-white/50 text-white text-sm font-bold uppercase tracking-wider transition-colors duration-300 w-full sm:w-auto"
          >
            <Phone className="w-4 h-4" />
            Call Us — {phone ? formatPhoneNumber(phone) : "Contact Us"}
          </a>
        </div>
      </div>
    </section>
  );
}
