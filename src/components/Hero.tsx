"use client";
import Image from 'next/image';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

const AnimatedSvgBackground = dynamic(() => import('../../components/AnimatedSvgBackground'), { ssr: false });

export default function Hero() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      setReduce(mq.matches);
      const onChange = (e: MediaQueryListEvent) => setReduce(e.matches);
      mq.addEventListener?.('change', onChange);
      return () => mq.removeEventListener?.('change', onChange);
    }
  }, []);

  return (
    <header className="relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-40">
        {!reduce && <AnimatedSvgBackground />}
      </div>

      <div className="relative mx-auto max-w-6xl px-6 pt-16 pb-10 sm:pt-20 sm:pb-16">
        <h1 className="font-extrabold tracking-tight leading-tight [font-size:clamp(2rem,6vw,4.25rem)] max-w-3xl">
          Transforming Imagination into Reality
        </h1>
        <p className="mt-4 max-w-2xl text-base sm:text-lg text-neutral-700">
          Redefining creative realization with Web3 × Gamification × AI.
        </p>
        <div className="mt-8 flex items-center gap-3">
          <Link href="#projects" className="inline-flex h-11 items-center rounded-xl px-5 bg-black text-white hover:bg-neutral-800 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-black">
            View Projects
          </Link>
          <Link href="#contact" className="inline-flex h-11 items-center rounded-xl px-5 ring-1 ring-inset ring-neutral-300 hover:bg-neutral-50 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-black">
            Contact Us
          </Link>
        </div>
        <div className="mt-12">
          <Image src="/image/hero-preview-en.webp" alt="Product preview" width={1440} height={900} priority className="w-full rounded-2xl border border-neutral-200 shadow-sm" />
        </div>
      </div>
    </header>
  );
}
