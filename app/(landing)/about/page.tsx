import React from "react";
import Link from "next/link";
import { Aclonica } from "next/font/google";
import { ShieldCheck, TrendingUp, Trophy, ArrowRight } from "lucide-react";

const aclonica = Aclonica({
  subsets: ["latin"],
  weight: ["400"],
});

export default function AboutPage() {
  return (
    <div className="w-full bg-zinc-50 text-zinc-900 font-sans selection:bg-brand-orange-500/10 selection:text-brand-orange-950">
      {/* ── HERO HEADER SECTION ── */}
      <section className="relative py-20 px-6 sm:px-10 overflow-hidden">
        {/* Subtle light background glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] rounded-full opacity-40"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(241,109,40,0.08) 0%, transparent 70%)",
          }}
        />

        <div className="relative max-w-4xl mx-auto text-center mt-6">
          <span className="text-[11px] font-extrabold tracking-[0.25em] text-brand-orange-500 uppercase mb-4 block">
            About The Academy
          </span>
          <h1
            className={`${aclonica.className} text-3xl sm:text-5xl font-normal text-zinc-900 tracking-tight leading-tight mt-1 mb-6`}
          >
            Where Dreams Take Flight &amp; Athletes Are Built
          </h1>
          <p className="text-sm sm:text-base text-zinc-500 max-w-2xl mx-auto leading-relaxed">
            The Academy of Gymnastics (TAG) is Pune&apos;s leading training center for physical excellence, artistic grace, and competitive athletic preparation. We are dedicated to cultivating strength, coordination, and confidence in every child through a structured, safety-first pathway.
          </p>
        </div>
      </section>

      {/* ── CORE PILLARS SECTION ── */}
      <section className="bg-white border-y border-zinc-200/60 py-20 px-6 sm:px-10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-400">
              Our Foundations
            </span>
            <h2 className="text-2xl sm:text-3xl font-light tracking-tight text-zinc-900 mt-2">
              Built on Three Key Pillars
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {/* Pillar 1: Safety */}
            <div className="flex flex-col items-start space-y-4 p-6 rounded-2xl bg-zinc-50/50 border border-zinc-100 hover:border-zinc-200 hover:bg-zinc-50/80 transition-all duration-300">
              <div className="h-10 w-10 rounded-xl bg-brand-orange-50 flex items-center justify-center text-brand-orange-500 shadow-sm">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-zinc-800 tracking-tight">
                Safety-First Facility
              </h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Equipped with professional-grade vaults, specialized balancing beams, uneven bars, and high-density landing mats. We design a risk-free environment so dreamers can safely test their limits.
              </p>
            </div>

            {/* Pillar 2: Level Curriculum */}
            <div className="flex flex-col items-start space-y-4 p-6 rounded-2xl bg-zinc-50/50 border border-zinc-100 hover:border-zinc-200 hover:bg-zinc-50/80 transition-all duration-300">
              <div className="h-10 w-10 rounded-xl bg-brand-orange-50 flex items-center justify-center text-brand-orange-500 shadow-sm">
                <TrendingUp className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-zinc-800 tracking-tight">
                Level-Based Curriculum
              </h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Our progressive curriculum systematically takes students from Beginner fundamentals through Foundation levels to competitive National standards, with clear milestones tracked transparently in our parent portal.
              </p>
            </div>

            {/* Pillar 3: Competition */}
            <div className="flex flex-col items-start space-y-4 p-6 rounded-2xl bg-zinc-50/50 border border-zinc-100 hover:border-zinc-200 hover:bg-zinc-50/80 transition-all duration-300">
              <div className="h-10 w-10 rounded-xl bg-brand-orange-50 flex items-center justify-center text-brand-orange-500 shadow-sm">
                <Trophy className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-zinc-800 tracking-tight">
                Championship Breeding
              </h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                TAG goes beyond basic recreation. Guided by elite coaches, our intensive competitive tracks prepare talented gymnasts to represent and win accolades at district, state, and national tournaments.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOUNDER SECTION (DARK ACCENT) ── */}
      <section className="relative w-full bg-zinc-950 py-24 px-6 sm:px-10 overflow-hidden text-white">
        {/* Subtle orange ambient glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] rounded-full"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(249,115,22,0.06) 0%, transparent 70%)",
          }}
        />

        <div className="relative max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
            {/* Left Col - Founder Story */}
            <div className="lg:col-span-7 space-y-6">
              <div className="space-y-2">
                <span className="text-[10px] font-extrabold tracking-[0.25em] text-brand-orange-500 uppercase block">
                  Founder &amp; Head Coach
                </span>
                <h2 className={`${aclonica.className} text-3xl sm:text-4xl text-white font-normal`}>
                  Saif Tamboli
                </h2>
              </div>
              
              <div className="h-px bg-gradient-to-r from-brand-orange-500/50 to-transparent w-20" />

              <p className="text-sm text-zinc-300 leading-relaxed">
                As an International Gymnast who represented India at the <strong>2022 Commonwealth Games</strong> and the <strong>2023 Senior Asian Artistic Gymnastics Championships</strong> in Singapore, Saif Tamboli founded TAG with a single vision: to bring world-class competitive training standards to Pune.
              </p>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Combining first-hand tournament experience with a deep technical focus, Saif personally designs the curriculums and mentors our coaching staff to ensure that students receive the most precise, modern, and inspiring guidance.
              </p>

              {/* Quote Block */}
              <div className="relative border-l-2 border-brand-orange-500 pl-4 py-1 mt-8">
                <p className="text-xs text-zinc-300 italic leading-relaxed">
                  &ldquo;An artist at heart, creating magic on and off the mat. TAG was built so every young dreamer in Pune could experience the joy, discipline, and wonder of gymnastics.&rdquo;
                </p>
              </div>
            </div>

            {/* Right Col - Stats Grid */}
            <div className="lg:col-span-5 grid grid-cols-2 gap-4">
              {[
                { value: "2022", label: "Commonwealth Games" },
                { value: "🇮🇳", label: "International Gymnast" },
                { value: "100%", label: "Safety Standards" },
                { value: "200+", label: "Active Athletes" },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="rounded-2xl p-6 flex flex-col justify-between"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    backdropFilter: "blur(8px)",
                    WebkitBackdropFilter: "blur(8px)",
                  }}
                >
                  <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white block">
                    {stat.value}
                  </span>
                  <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block mt-2">
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CALL TO ACTION SECTION ── */}
      <section className="bg-zinc-50 py-24 px-6 sm:px-10 border-t border-zinc-200/50">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <div className="space-y-3">
            <h2 className="text-3xl sm:text-4xl font-light tracking-tight text-zinc-900">
              Begin Your Gymnastics Journey Today
            </h2>
            <p className="text-sm text-zinc-500 max-w-lg mx-auto leading-relaxed">
              Whether starting as a beginner building basic physical confidence or training for competitive state and national levels, TAG has a program tailored for you.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/register"
              className="w-full sm:w-auto px-8 py-3 rounded-lg text-xs font-bold uppercase tracking-wider text-white bg-brand-orange-500 hover:bg-brand-orange-600 transition-all duration-200 shadow-md shadow-brand-orange-500/10 hover:shadow-brand-orange-500/20 active:scale-[0.98] text-center"
            >
              Register Now
            </Link>
            <Link
              href="/program"
              className="w-full sm:w-auto px-8 py-3 rounded-lg text-xs font-bold uppercase tracking-wider text-zinc-700 bg-white hover:bg-zinc-100 border border-zinc-200 hover:border-zinc-300 transition-all duration-200 text-center flex items-center justify-center gap-2"
            >
              <span>Explore Programs</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
