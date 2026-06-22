"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ArrowRight } from "lucide-react";

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "About", href: "/about" },
    { name: "Program", href: "/program" },
    { name: "FAQ", href: "/faq" },
    { name: "Gallery", href: "/gallery" },
    { name: "Blog", href: "/blog" },
  ];

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  const isHomePage = pathname === "/";
  const isTransparent = isHomePage && !isScrolled;

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300 ${
      isTransparent
        ? "border-b border-transparent bg-transparent"
        : "border-b border-zinc-200/80 bg-white/80 backdrop-blur-md shadow-sm"
    }`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and Brand */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className={`h-9 w-9 overflow-hidden rounded-full border p-0.5 shadow-inner transition-transform group-hover:scale-105 duration-300 ${
                isTransparent ? "border-white/20 bg-white/10" : "border-zinc-200 bg-zinc-100"
              }`}>
                <img
                  src="/logo.webp"
                  alt="Academy of Gymnastics Logo"
                  className={`h-full w-full object-cover rounded-full transition-all duration-500 ${
                    isTransparent ? "filter brightness-110" : "filter grayscale group-hover:grayscale-0"
                  }`}
                />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-widest text-brand-orange-500 leading-none">
                  The Academy
                </span>
                <span className={`text-xs font-bold tracking-wide mt-0.5 leading-none transition-colors duration-300 ${
                  isTransparent ? "text-white" : "text-zinc-900"
                }`}>
                  of Gymnastics
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-xs font-bold uppercase tracking-wider transition-colors duration-200 ${
                    active 
                      ? "text-brand-orange-500" 
                      : isTransparent 
                        ? "text-zinc-300 hover:text-white" 
                        : "text-zinc-500 hover:text-zinc-900"
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Action Buttons (Desktop) */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/register"
              className={`text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-lg transition-all duration-200 cursor-pointer border ${
                isTransparent
                  ? "text-zinc-300 hover:text-white border-white/20 hover:border-white"
                  : "text-zinc-650 hover:text-zinc-900 border-zinc-200 hover:border-zinc-400"
              }`}
            >
              Register
            </Link>
            <Link
              href="/portal"
              className="text-xs font-bold uppercase tracking-wider text-white bg-brand-orange-500 hover:bg-brand-orange-600 px-4 py-2 rounded-lg transition-all duration-200 shadow-md shadow-brand-orange-500/10 hover:shadow-brand-orange-500/20 active:scale-[0.98] cursor-pointer"
            >
              Parent Portal
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              type="button"
              className={`inline-flex items-center justify-center rounded-md p-2 focus:outline-none cursor-pointer transition-colors ${
                isTransparent
                  ? "text-zinc-300 hover:bg-white/10 hover:text-white"
                  : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
              }`}
              aria-controls="mobile-menu"
              aria-expanded={isMobileMenuOpen}
            >
              <span className="sr-only">Open main menu</span>
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Menu className="h-5 w-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      {isMobileMenuOpen && (
        <div className={`md:hidden border-t backdrop-blur-lg animate-menu-show ${
          isTransparent 
            ? "border-white/10 bg-zinc-950/95 text-white" 
            : "border-zinc-100 bg-white/95 text-zinc-900"
        }`} id="mobile-menu">
          <div className="space-y-1 px-4 py-4 pb-3">
            {navLinks.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
                    active
                      ? isTransparent 
                        ? "bg-white/10 text-brand-orange-500" 
                        : "bg-zinc-100 text-brand-orange-500"
                      : isTransparent
                        ? "text-zinc-300 hover:bg-white/5 hover:text-white"
                        : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
            <div className={`grid grid-cols-2 gap-3 pt-4 border-t mt-4 ${
              isTransparent ? "border-white/10" : "border-zinc-100"
            }`}>
              <Link
                href="/register"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center justify-center rounded-lg py-2.5 text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer border ${
                  isTransparent
                    ? "border-white/20 text-zinc-300 hover:text-white"
                    : "border-zinc-200 text-zinc-650 hover:text-zinc-900"
                }`}
              >
                Register
              </Link>
              <Link
                href="/portal"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-center rounded-lg bg-brand-orange-500 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-brand-orange-600 transition-all duration-200 cursor-pointer"
              >
                Portal
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
