"use client";

import React from "react";
import Link from "next/link";
import { Aclonica } from "next/font/google";
import { formatPhoneNumber, getTelLink } from "@/lib/utils/phone";

const aclonica = Aclonica({ subsets: ["latin"], weight: ["400"] });

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Programs", href: "/programs" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
  { label: "Register", href: "/register" },
];

const socialLinks = [
  {
    label: "Instagram",
    href: "https://www.instagram.com/theacademyofgymnastics__/",
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    ),
  },
  {
    label: "YouTube",
    href: "https://www.youtube.com/@academy",
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
];

export default function FooterSection({ phone, phone2 }: { phone?: string; phone2?: string }) {
  return (
    <footer className="relative w-full bg-[#0a0a0b] text-white border-t border-zinc-800/60">
      {/* Main Footer Body */}
      <div className="w-full px-4 sm:px-6 md:px-8 pt-16 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-8">

          {/* Column 1: Brand (4 cols) */}
          <div className="md:col-span-4 flex flex-col gap-6">
            {/* Logo */}
            <img
              src="/icons/logo.webp"
              alt="The Academy of Gymnastics"
              className="h-14 w-auto object-contain select-none"
            />
            <p className="text-zinc-400 text-sm font-light leading-relaxed max-w-xs">
              India&apos;s premier gymnastics academy — developing athletes from grassroots to national competition through world-class coaching and a 30,000 sq ft training facility.
            </p>
            {/* Social Icons */}
            <div className="flex items-center gap-3">
              {socialLinks.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="flex items-center justify-center w-9 h-9 rounded-full bg-zinc-800 text-zinc-400 transition-colors duration-300 hover:bg-brand-orange-500 hover:text-white"
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Column 2: Quick Links (2 cols) */}
          <div className="md:col-span-2">
            <h3 className={`${aclonica.className} text-xs uppercase tracking-[0.2em] text-zinc-500 mb-5`}>
              Quick Links
            </h3>
            <nav className="flex flex-col gap-3">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-zinc-400 text-sm font-light hover:text-white transition-colors duration-200"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Column 3: Contact (2 cols) */}
          <div className="md:col-span-2">
            <h3 className={`${aclonica.className} text-xs uppercase tracking-[0.2em] text-zinc-500 mb-5`}>
              Contact
            </h3>
            <div className="flex flex-col gap-3">
              {phone ? (
                <>
                  <a
                    href={getTelLink(phone)}
                    className="text-zinc-400 text-sm font-light hover:text-white transition-colors duration-200"
                  >
                    {formatPhoneNumber(phone)}
                  </a>
                  {phone2 && (
                    <a
                      href={getTelLink(phone2)}
                      className="text-zinc-400 text-sm font-light hover:text-white transition-colors duration-200"
                    >
                      {formatPhoneNumber(phone2)}
                    </a>
                  )}
                </>
              ) : (
                <a
                  href="#"
                  className="text-zinc-400 text-sm font-light hover:text-white transition-colors duration-200"
                >
                  Contact Us
                </a>
              )}
              <a
                href="mailto:contact@academy.com"
                className="text-zinc-400 text-sm font-light hover:text-white transition-colors duration-200 break-all"
              >
                contact@academy.com
              </a>
              <p className="text-zinc-500 text-sm font-light leading-relaxed">
                Mumbai, Maharashtra, India
              </p>
            </div>
          </div>

          {/* Column 4: Google Maps (4 cols) */}
          <div className="md:col-span-4">
            <h3 className={`${aclonica.className} text-xs uppercase tracking-[0.2em] text-zinc-500 mb-5`}>
              Find Us
            </h3>
            <div className="w-full rounded-2xl overflow-hidden border border-zinc-800">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3771.1234567890123!2d72.9031!3d19.0760!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2sThe%20Academy%20of%20Gymnastics!5e0!3m2!1sen!2sin!4v1234567890123!5m2!1sen!2sin&q=The+Academy+of+Gymnastics+Mumbai"
                width="100%"
                height="200"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="The Academy of Gymnastics Location"
                className="w-full"
              />
            </div>
            <a
              href="https://maps.app.goo.gl/TMXiu9ved2cqDRx9A"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 text-brand-orange-500 text-[11px] font-bold uppercase tracking-wider hover:text-brand-orange-600 transition-colors duration-200"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Open in Google Maps
            </a>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-zinc-800/60 px-4 sm:px-6 md:px-8 py-5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-zinc-600 text-[11px] font-light">
            © {new Date().getFullYear()} The Academy of Gymnastics. All rights reserved.
          </p>
          <p className="text-zinc-600 text-[11px] font-light">
            Designed with <span className="text-brand-orange-500">♥</span> for champions.
          </p>
          <a
            href="https://helpah.online"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-zinc-600 text-[11px] font-light hover:text-zinc-400 transition-colors duration-200"
          >
            Powered by
            <img
              src="/images/helpah_dark_logo.avif"
              alt="Helpah"
              className="h-4 w-auto object-contain"
            />
          </a>
        </div>
      </div>
    </footer>
  );
}
