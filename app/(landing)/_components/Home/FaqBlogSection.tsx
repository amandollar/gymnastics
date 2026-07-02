"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import { Aclonica } from "next/font/google";
import { formatPhoneNumber } from "@/lib/utils/phone";
import ParallaxFoam from "./ParallaxFoam";

const aclonica = Aclonica({ subsets: ["latin"], weight: ["400"] });

const faqs = [
  {
    q: "What age can my child start gymnastics?",
    a: "We welcome children from as young as 3 years old in our introductory classes. Our programs are age and ability appropriate, so every child starts at the right level.",
  },
  {
    q: "Do I need any prior experience to join?",
    a: "Absolutely not. Our Recreational and beginner programs are designed for zero experience. Our coaches assess every new athlete and place them in the right group.",
  },
  {
    q: "How many days a week are classes held?",
    a: "Classes vary by program. Recreational classes run 2–3 days a week while competitive programs can involve up to 5 days. We offer flexible scheduling options.",
  },
  {
    q: "What should my child wear to class?",
    a: "Girls should wear a leotard and boys a fitted t-shirt with shorts or leggings. Bare feet are required on the gymnastics floor. No jewellery please.",
  },
  {
    q: "Is there a trial class available?",
    a: "Yes! We offer a complimentary trial session so your child can experience the facility and meet the coaches before you commit to enrolment.",
  },
  {
    q: "How do I register my child?",
    a: "You can register through our website or call us directly. Our team will guide you through the process and answer any questions.",
  },
];

const blogPosts = [
  {
    date: "June 2025",
    category: "Competition",
    title: "Our Athletes Shine at State Championships 2025",
    snippet:
      "Three of our competitive gymnasts secured podium finishes at this year's Maharashtra State Gymnastics Championships. Here's a look at their journey.",
    image: "/images/gymnast_strength.png",
  },
  {
    date: "May 2025",
    category: "Training",
    title: "Why Foundation Skills Matter More Than Anything Else",
    snippet:
      "Head Coach Saif shares his philosophy on building elite gymnasts from the ground up — and why rushing skill progression holds athletes back.",
    image: "/images/bar-equipment.webp",
  },
  {
    date: "April 2025",
    category: "Facility",
    title: "A Look Inside Our Newly Expanded Training Floor",
    snippet:
      "We recently added 3,000 sq ft of new training space, including a dedicated acrobatics zone and a professional spring floor. Take the tour.",
    image: "/images/gym-floor.png",
  },
];

export default function FaqBlogSection({ phone, phone2 }: { phone?: string; phone2?: string }) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [animate, setAnimate] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const formattedPhone = phone ? formatPhoneNumber(phone) : "Contact Us";
  const formattedPhone2 = phone2 ? formatPhoneNumber(phone2) : "";
  const phoneText = formattedPhone2 ? `${formattedPhone} / ${formattedPhone2}` : formattedPhone;

  const dynamicFaqs = useMemo(() => {
    return faqs.map((faq) => {
      // Apply any dynamic replacements if needed
      return faq;
      }
      return faq;
    });
  }, [phoneText]);

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
        src="/landing-page-foams/orange-pyramid-2.webp"
        top="15%"
        left="4%"
        size={40}
        rotate={12}
        speed={0.1}
      />
      <ParallaxFoam
        src="/landing-page-foams/white-cube-2.webp"
        top="45%"
        right="6%"
        size={70}
        blur="sm"
        rotate={-25}
        speed={0.15}
      />
      <ParallaxFoam
        src="/landing-page-foams/white-donut-1.webp"
        top="75%"
        left="5%"
        size={80}
        blur="md"
        rotate={20}
        speed={0.08}
      />
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes fb-fade-up {
              from { opacity: 0; transform: translateY(24px); }
              to   { opacity: 1; transform: translateY(0); }
            }
            .fb-item {
              opacity: 0;
              will-change: transform, opacity;
            }
            .fb-animate .fb-item {
              animation: fb-fade-up 0.9s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            }
            .faq-answer {
              display: grid;
              grid-template-rows: 0fr;
              transition: grid-template-rows 0.4s cubic-bezier(0.16, 1, 0.3, 1);
            }
            .faq-answer.open {
              grid-template-rows: 1fr;
            }
            .faq-answer > div {
              overflow: hidden;
            }
          `,
        }}
      />

      <div className={`grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 ${animate ? "fb-animate" : ""}`}>

        {/* ── Left: FAQ ── */}
        <div>
          <div className="mb-10 fb-item" style={{ animationDelay: "0s" }}>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-orange-500 mb-3">
              Got Questions?
            </p>
            <h2 className={`${aclonica.className} text-4xl sm:text-5xl font-normal tracking-tight leading-[1.1] text-zinc-900 uppercase`}>
              FAQs
            </h2>
          </div>

          <div className="flex flex-col divide-y divide-zinc-200 fb-item" style={{ animationDelay: "0.1s" }}>
            {dynamicFaqs.map((faq, i) => (
              <div key={i} className="py-4">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between gap-4 text-left group"
                  aria-expanded={openFaq === i}
                >
                  <span className="text-zinc-900 text-sm sm:text-base font-medium leading-snug group-hover:text-brand-orange-500 transition-colors duration-200">
                    {faq.q}
                  </span>
                  <span
                    className="shrink-0 w-6 h-6 rounded-full border border-zinc-200 flex items-center justify-center text-zinc-400 transition-all duration-300"
                    style={{
                      transform: openFaq === i ? "rotate(45deg)" : "rotate(0deg)",
                      borderColor: openFaq === i ? "#f16d28" : undefined,
                      color: openFaq === i ? "#f16d28" : undefined,
                    }}
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
                    </svg>
                  </span>
                </button>
                <div className={`faq-answer ${openFaq === i ? "open" : ""}`}>
                  <div>
                    <p className="text-zinc-500 text-sm font-light leading-relaxed pt-3 pr-8">
                      {faq.a}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right: Blog / News ── */}
        <div>
          <div className="mb-10 fb-item" style={{ animationDelay: "0.15s" }}>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-orange-500 mb-3">
              From the Academy
            </p>
            <h2 className={`${aclonica.className} text-4xl sm:text-5xl font-normal tracking-tight leading-[1.1] text-zinc-900 uppercase`}>
              Latest News
            </h2>
          </div>

          <div className="flex flex-col gap-4">
            {blogPosts.map((post, i) => (
              <article
                key={post.title}
                className="fb-item group flex gap-4 bg-white rounded-2xl overflow-hidden border border-zinc-100 hover:shadow-md transition-shadow duration-500 p-4"
                style={{ animationDelay: `${0.25 + i * 0.12}s` }}
              >
                {/* Thumbnail */}
                <div className="shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-zinc-100">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                {/* Text */}
                <div className="flex flex-col justify-center min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-brand-orange-500">
                      {post.category}
                    </span>
                    <span className="text-zinc-300 text-[10px]">•</span>
                    <span className="text-zinc-400 text-[10px]">{post.date}</span>
                  </div>
                  <h3 className="text-zinc-900 text-sm font-semibold leading-snug line-clamp-2 mb-1">
                    {post.title}
                  </h3>
                  <p className="text-zinc-500 text-[12px] font-light leading-relaxed line-clamp-2">
                    {post.snippet}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
