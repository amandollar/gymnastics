"use client";

import React, { useMemo, useRef } from "react";
import { Aclonica } from "next/font/google";
import { Dumbbell, Award, Users, Star } from "lucide-react";

import ParallaxFoam from "./ParallaxFoam";

const aclonica = Aclonica({ subsets: ["latin"], weight: ["400"] });

interface CoachesSectionProps {
  initialCoaches?: {
    id: string;
    name: string;
    specialization?: string | null;
    avatarUrl?: string | null;
    bio?: string | null;
    experience?: number | null;
    certifications?: string | null;
  }[];
}

const defaultStaticCoaches = [
  {
    name: "Saif",
    title: "Head Coach & Founder",
    image: "/images/gymnast_potential.png",
    bio: "Head Coach and founder of The Academy of Gymnastics, specializing in MAG/WAG elite training with over 10 years of experience shaping champions.",
    experience: "10+ Years",
    certifications: "FIG Level 1 Certified",
  },
  {
    name: "Priya",
    title: "Recreational & Junior Coach",
    image: "/images/gymnast_strength.png",
    bio: "Dedicated junior instructor passionate about teaching the fundamentals of gymnastics to recreational age groups and building physical confidence.",
    experience: "5+ Years",
    certifications: "USAG Safety Certified",
  },
  {
    name: "Arjun",
    title: "Strength & Conditioning",
    image: "/images/boy-doing-bar-move.webp",
    bio: "Specializes in physical conditioning, flexibility training, and strength development for competitive and developmental gymnasts.",
    experience: "4+ Years",
    certifications: "B.P.Ed, First Aid Certified",
  },
];

export default function CoachesSection({
  initialCoaches,
}: CoachesSectionProps) {
  const trackRef = useRef<HTMLDivElement>(null);

  const displayCoaches = useMemo(() => {
    if (initialCoaches && initialCoaches.length > 0) {
      return initialCoaches.map((c) => ({
        name: c.name.replace(/^Coach\s+/i, ""),
        title: c.specialization || "Gymnastics Coach",
        image: c.avatarUrl || "/icons/coach-profile-placeholder.webp",
        bio: c.bio || null,
        experience: c.experience ? `${c.experience}+ Years` : null,
        certifications: c.certifications || null,
      }));
    }
    return defaultStaticCoaches;
  }, [initialCoaches]);

  const loopCoaches =
    displayCoaches.length < 4
      ? [...displayCoaches, ...displayCoaches, ...displayCoaches]
      : [...displayCoaches, ...displayCoaches];

  return (
    <section className="relative w-full bg-white text-zinc-950 py-20 overflow-hidden">
      {/* Background Foam Shapes */}
      <ParallaxFoam
        src="/landing-page-foams/orange-pyramid-4.webp"
        top="10%"
        left="5%"
        size={60}
        rotate={18}
        speed={0.14}
      />
      <ParallaxFoam
        src="/landing-page-foams/white-donut-1.webp"
        top="45%"
        right="6%"
        size={90}
        blur="lg"
        rotate={-30}
        speed={0.1}
      />
      <ParallaxFoam
        src="/landing-page-foams/white-cube-2.webp"
        top="75%"
        left="8%"
        size={70}
        rotate={12}
        speed={0.16}
      />
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes marquee-left {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .coaches-track {
          display: flex;
          width: max-content;
          animation: marquee-left 36s linear infinite;
          will-change: transform;
        }
        .coaches-track:hover {
          animation-play-state: paused;
        }
        .coach-card {
          width: 270px;
          background: #ffffff;
        }
        @media (min-width: 768px) {
          .coach-card { width: 310px; }
        }
        @media (min-width: 1024px) {
          .coach-card { width: 350px; }
        }
      `,
        }}
      />

      {/* Fade edges */}
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-24 z-10"
        style={{
          background: "linear-gradient(to right, #ffffff 0%, transparent 100%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 w-24 z-10"
        style={{
          background: "linear-gradient(to left, #ffffff 0%, transparent 100%)",
        }}
      />

      {/* Header */}
      <div className="relative z-10 text-center mb-12 px-4">
        <h2
          className={`${aclonica.className} text-4xl sm:text-5xl md:text-6xl font-normal tracking-tight text-zinc-900 uppercase`}
        >
          Meet Our Coaches
        </h2>
      </div>

      {/* Marquee */}
      <div className="relative overflow-hidden">
        <div ref={trackRef} className="coaches-track py-24">
          {loopCoaches.map((coach, i) => (
            <div
              key={`${coach.name}-${i}`}
              className="coach-card flex-shrink-0 mx-3 rounded-[32px] cursor-default overflow-hidden flex flex-col relative"
              style={{ background: "#fdefe2ff" }}
            >
              {/* Blurred background image */}
              <div
                className="absolute inset-0 z-0 bg-cover bg-center pointer-events-none opacity-15 blur-lg scale-110"
                style={{ backgroundImage: `url(${coach.image})` }}
              />

              {/* ── Top row: avatar  +  experience badge ── */}
              <div className="flex items-start justify-between relative z-10">
                {/* Avatar touching top-left */}
                <div
                  className="coach-avatar w-40 h-40 md:w-48 md:h-48 lg:w-56 lg:h-56 overflow-hidden bg-zinc-300 flex-shrink-0"
                  style={{ borderRadius: "0 15% 75% 60% / 0 60% 75% 15%" }}
                >
                  <img
                    src={coach.image}
                    alt={coach.name}
                    className="w-full h-full object-cover object-top"
                  />
                </div>

                {/* Experience */}
                {coach.experience &&
                  (() => {
                    const numMatch = coach.experience.match(/^(\d+\+?)/);
                    const num = numMatch ? numMatch[0] : coach.experience;
                    return (
                      <div className="flex flex-col items-end pt-5 pr-5 md:pt-6 md:pr-6">
                        {/* First line: Number (Large and Thin) */}
                        <span className="text-zinc-950 text-[32px] md:text-[40px] lg:text-[48px] font-light leading-none">
                          {num}
                        </span>
                        {/* Second line: YEARS OF */}
                        <span className="text-zinc-950 text-[10px] md:text-[11px] font-bold uppercase tracking-wider mt-1 leading-none">
                          Years of
                        </span>
                        {/* Third line: EXPERIENCE */}
                        <span className="text-zinc-950 text-[10px] md:text-[11px] font-bold uppercase tracking-widest mt-0.5 leading-none">
                          Experience
                        </span>
                      </div>
                    );
                  })()}
              </div>

              {/* ── Content wrapper (padded inside the card) ── */}
              <div className="px-5 pb-5 md:px-6 md:pb-6 flex-1 flex flex-col relative z-10">
                {/* Name */}
                <h3 className="text-zinc-900 text-[20px] md:text-[24px] lg:text-[26px] font-bold tracking-tight leading-snug mt-4">
                  {coach.name}
                </h3>
                <p className="text-zinc-600 text-[10px] md:text-[11px] font-bold uppercase tracking-wider mt-0">
                  {coach.title}
                </p>

                {/* ── Details ── */}
                {(() => {
                  const details = [
                    coach.certifications && {
                      key: "certifications",
                      label: "Certifications",
                      value: coach.certifications,
                      icon: Award,
                      iconClass: "text-brand-orange-500",
                    },
                    coach.bio && {
                      key: "bio",
                      label: "About",
                      value: coach.bio,
                      icon: Users,
                      iconClass: "text-brand-orange-500",
                    },
                  ].filter(Boolean) as {
                    key: string;
                    label: string;
                    value: string;
                    icon: React.ComponentType<{ className?: string }>;
                    iconClass: string;
                  }[];

                  return (
                    <div className="mt-5 flex flex-col gap-4">
                      {details.map((detail) => {
                        const Icon = detail.icon;
                        return (
                          <div
                            key={detail.key}
                            className="flex items-start justify-start gap-3.5 md:gap-4 text-left"
                          >
                            <Icon
                              className={`w-6 h-6 stroke-[1.75] flex-shrink-0 mt-0.5 ${detail.iconClass}`}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-zinc-600 uppercase tracking-widest text-[9px] md:text-[10px] font-semibold leading-none">
                                {detail.label}
                              </p>
                              <p className="text-zinc-800 text-[13px] md:text-[14px] font-normal mt-1 leading-snug break-words">
                                {detail.value}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
