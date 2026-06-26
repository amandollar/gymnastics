"use client";

import React from "react";
import { Aclonica } from "next/font/google";

import ParallaxFoam from "./ParallaxFoam";

const aclonica = Aclonica({
  subsets: ["latin"],
  weight: ["400"],
});

export default function TrainingSpaceSection() {
  const images = [
    { src: "/traingin-space/38b68195-c328-4cad-be28-81e5bcabb6b2.png", alt: "Gymnast main floor layout" },
    { src: "/traingin-space/download.jpeg", alt: "Gymnast parallel bars area" },
    { src: "/traingin-space/unnamed.jpg", alt: "Gymnast rings setup" },
    { src: "/traingin-space/unnamed (1).jpg", alt: "Gymnast vaulting horse" },
    { src: "/traingin-space/38b68195-c328-4cad-be28-81e5bcabb6b2.png", alt: "Gymnast training facility overview" },
    { src: "/traingin-space/download.jpeg", alt: "Gymnast practice foam pit" },
  ];

  return (
    <section className="relative w-full bg-white text-zinc-950 pt-24 pb-20 md:pt-[10vw] md:pb-[8vw] px-4 sm:px-6 md:px-[4vw] border-b border-zinc-200/80 overflow-hidden">
      {/* Background Foam Shapes */}
      <ParallaxFoam
        src="/landing-page-foams/orange-donut-1.webp"
        top="15%"
        left="5%"
        size={80}
        blur="sm"
        rotate={-15}
        speed={0.12}
      />
      <ParallaxFoam
        src="/landing-page-foams/white-pyramid-3.webp"
        top="45%"
        right="4%"
        size={55}
        rotate={45}
        speed={0.15}
      />
      <ParallaxFoam
        src="/landing-page-foams/white-cube-1.webp"
        top="75%"
        left="8%"
        size={50}
        blur="md"
        rotate={-10}
        speed={0.08}
      />
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .space-grid-card {
              border-radius: 3.5rem 0px 0px 0px;
              transition: border-radius 0.7s cubic-bezier(0.16, 1, 0.3, 1);
              will-change: border-radius;
            }
            .space-grid-card:hover {
              border-radius: 0px 0px 3.5rem 0px;
            }
            .space-grid-img {
              transition: transform 0.7s cubic-bezier(0.16, 1, 0.3, 1);
              will-change: transform;
            }
            .space-grid-card:hover .space-grid-img {
              transform: scale(1.06);
            }
            @media (min-width: 768px) {
              .space-grid-card {
                border-radius: 4vw 0px 0px 0px;
              }
              .space-grid-card:hover {
                border-radius: 0px 0px 4vw 0px;
              }
            }
          `,
        }}
      />

      <div className="w-full">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-[5vw] items-start">
          
          {/* Left Column: Sticky Title & Description */}
          <div className="md:col-span-5 lg:col-span-4 md:sticky md:top-[8vw] flex flex-col gap-6 md:gap-[2vw] text-left">
            <h2 className={`${aclonica.className} text-4xl sm:text-5xl md:text-[3.5vw] font-normal tracking-tight leading-[1.1] text-zinc-900 uppercase`}>
              Our training<br />space
            </h2>
            <p className="text-zinc-500 text-sm sm:text-base md:text-[1.1vw] lg:text-[1vw] font-light leading-relaxed max-w-md md:max-w-[24vw]">
              A state-of-the-art facility meticulously designed to help athletes unlock their full physical potential and train with absolute precision.
            </p>
          </div>

          {/* Right Column: 6-Image Grid */}
          <div className="md:col-span-7 lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-[1.5vw] w-full">
            {images.map((img, idx) => (
              <div 
                key={idx} 
                className="space-grid-card group relative w-full aspect-[4/3] overflow-hidden bg-zinc-100"
              >
                <img
                  src={img.src}
                  alt={img.alt}
                  className="space-grid-img w-full h-full object-cover select-none pointer-events-none"
                />
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
