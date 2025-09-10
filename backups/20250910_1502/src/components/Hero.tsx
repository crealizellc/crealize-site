"use client";
import Image from 'next/image';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

const AnimatedSvgBackground = dynamic(() => import('../../components/AnimatedSvgBackground'), { ssr: false });

export default function Hero() {
  const [mounted, setMounted] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    setMounted(true);
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    const apply = () => setReduceMotion(Boolean(mq?.matches));
    apply();
    mq?.addEventListener ? mq.addEventListener('change', apply) : mq?.addListener?.(apply);
    return () => {
      mq?.removeEventListener ? mq.removeEventListener('change', apply) : mq?.removeListener?.(apply);
    };
  }, []);

  return (
    <header className="relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-40">
        {mounted && !reduceMotion && <AnimatedSvgBackground />}
      </div>

      <div className="relative mx-auto max-w-6xl px-6 pt-16 pb-10 sm:pt-20 sm:pb-16">
        <h1 className="font-extrabold tracking-tight leading-tight [font-size:clamp(2rem,6vw,4.25rem)] max-w-3xl">
          Transforming Imagination into Reality
        </h1>
        <p className="mt-4 max-w-2xl text-base sm:text-lg text-neutral-700">
          Redefining creative realization with Web3 × Gamification × AI.
        </p>
        {/* CTA 与 LCP 图如需零视觉变更可先保持关闭 */}
      </div>
    </header>
  );
}
