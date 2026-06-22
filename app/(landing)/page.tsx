import React from "react";
import { Aclonica } from "next/font/google";

const aclonica = Aclonica({
  subsets: ["latin"],
  weight: ["400"],
});

interface LineTextProps {
  text: string;
  startDelay: number;
}

function LineText({ text, startDelay }: LineTextProps) {
  return (
    <span className="inline-flex flex-wrap">
      {text.split("").map((char, index) => {
        const isSpace = char === " ";
        return (
          <span
            key={index}
            className="reveal-char inline-block"
            style={{
              animationDelay: `${startDelay + index * 0.045}s`,
            }}
          >
            {isSpace ? "\u00A0" : char}
          </span>
        );
      })}
    </span>
  );
}

export default function Home() {
  return (
    <div className="relative w-full flex-1 flex items-center min-h-[85vh] sm:min-h-screen overflow-hidden">
      {/* Video Background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none z-0"
      >
        <source src="/videos/Welcome%20to%20WCC.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Dark Overlay over video for contrast */}
      <div className="absolute inset-0 bg-black/40 z-0" />

      {/* Left aligned & vertically centered text content */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-12 md:pl-[6vw] md:px-0 md:mx-0 md:max-w-none">
        <style
          dangerouslySetInnerHTML={{
            __html: `
          @keyframes reveal-char {
            from {
              opacity: 0;
              transform: translateY(28px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .reveal-char {
            opacity: 0;
            animation: reveal-char 1.0s cubic-bezier(0.05, 0.95, 0.1, 1) forwards;
          }
        `,
          }}
        />
        <div className="w-full text-left">
          <h1
            className={`${aclonica.className} text-4xl sm:text-5xl md:text-[7.5vw] font-normal text-white leading-tight md:leading-[1.1] drop-shadow-lg flex flex-col`}
          >
            <span className="block">
              <LineText text="It All Starts" startDelay={0.12} />
            </span>
            <span className="block mt-2 md:mt-0">
              <LineText text="with a Dream" startDelay={0.12} />
            </span>
          </h1>
        </div>
      </div>
    </div>
  );
}
