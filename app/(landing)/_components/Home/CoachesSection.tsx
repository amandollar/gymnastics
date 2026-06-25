"use client";

import React, { useEffect, useRef, useState } from "react";
import { Aclonica } from "next/font/google";

const aclonica = Aclonica({ subsets: ["latin"], weight: ["400"] });

const coaches = [
  {
    name: "Coach Saif",
    title: "Head Coach & Founder",
    image: "/images/gymnast_potential.png",
    instagram: "https://www.instagram.com/theacademyofgymnastics__/",
    youtube: "https://www.youtube.com/@saifgymnast",
  },
  {
    name: "Coach Priya",
    title: "Recreational & Junior Coach",
    image: "/images/gymnast_strength.png",
    instagram: "https://www.instagram.com/theacademyofgymnastics__/",
    youtube: null,
  },
  {
    name: "Coach Arjun",
    title: "Strength & Conditioning",
    image: "/images/boy-doing-bar-move.webp",
    instagram: null,
    youtube: null,
  },
];

export default function CoachesSection() {
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
      { threshold: 0.15 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative w-full bg-zinc-50 text-zinc-950 py-24 px-4 sm:px-6 md:px-8 border-b border-zinc-200/80"
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes coach-fade-up {
              from { opacity: 0; transform: translateY(24px); }
              to   { opacity: 1; transform: translateY(0); }
            }
            .coach-item {
              opacity: 0;
              will-change: transform, opacity;
            }
            .coach-animate .coach-item {
              animation: coach-fade-up 0.9s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            }
          `,
        }}
      />

      <div className={`max-w-7xl mx-auto w-full ${animate ? "coach-animate" : ""}`}>
        {/* Simplified Header */}
        <div className="text-center mb-16 max-w-2xl mx-auto coach-item" style={{ animationDelay: "0s" }}>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-orange-500 mb-3">
            The Team
          </p>
          <h2 className={`${aclonica.className} text-4xl sm:text-5xl md:text-6xl font-normal tracking-tight text-zinc-900 uppercase mb-4`}>
            Meet Our Coaches
          </h2>
          <p className="text-zinc-500 text-sm sm:text-base font-light leading-relaxed">
            Our certified coaching staff brings competitive and instructional experience, committed to drawing out the best in every athlete.
          </p>
        </div>

        {/* Simplified Circle Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 justify-center w-full">
          {coaches.map((coach, i) => (
            <div
              key={coach.name}
              className="coach-item group flex flex-col items-center text-center"
              style={{ animationDelay: `${0.2 + i * 0.12}s` }}
            >
              {/* Circle Image Wrapper with Hover Effect */}
              <div className="relative w-44 h-44 sm:w-48 sm:h-48 rounded-full overflow-hidden bg-zinc-200 border-4 border-white shadow-md transition-all duration-500 group-hover:scale-105 group-hover:shadow-lg group-hover:border-brand-orange-500/20 group-hover:ring-4 group-hover:ring-brand-orange-500/30">
                <img
                  src={coach.image}
                  alt={coach.name}
                  className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-110"
                />
              </div>

              {/* Coach Details */}
              <div className="mt-6 flex flex-col items-center">
                <h3 className={`${aclonica.className} text-lg sm:text-xl font-normal text-zinc-900 uppercase tracking-tight`}>
                  {coach.name}
                </h3>
                <p className="text-brand-orange-500 text-xs font-bold uppercase tracking-wider mt-1">
                  {coach.title}
                </p>

                {/* Social Links */}
                {(coach.instagram || coach.youtube) && (
                  <div className="mt-4 flex items-center gap-3">
                    {coach.instagram && (
                      <a
                        href={coach.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Instagram"
                        className="flex items-center justify-center w-7 h-7 rounded-full bg-zinc-200/60 text-zinc-600 transition-colors duration-300 hover:bg-brand-orange-500 hover:text-white"
                      >
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                        </svg>
                      </a>
                    )}
                    {coach.youtube && (
                      <a
                        href={coach.youtube}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="YouTube"
                        className="flex items-center justify-center w-7 h-7 rounded-full bg-zinc-200/60 text-zinc-600 transition-colors duration-300 hover:bg-brand-orange-500 hover:text-white"
                      >
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                        </svg>
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
