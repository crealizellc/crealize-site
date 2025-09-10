'use client';
import {usePathname} from 'next/navigation';
import {useLocale} from 'next-intl';
import './hero-overlay.css';
import {heroCopy} from './hero.copy';

const LOCALES = ['en','ja','zh-TW'] as const;
function swapLocale(path: string, target: string) {
  const seg = path.split('/').filter(Boolean);
  if (seg.length === 0) return `/${target}/`;
  if ((LOCALES as readonly string[]).includes(seg[0])) seg[0] = target; else seg.unshift(target);
  return '/' + seg.join('/') + (path.endsWith('/') ? '/' : '/');
}

export default function HeroOverlay(){
  const path = usePathname() || '/en/';
  const raw = useLocale();
  const normalized = (raw === 'zh-Hant' ? 'zh-TW' : raw) as string;
  const copy = heroCopy[(LOCALES as readonly string[]).includes(normalized) ? (normalized as typeof LOCALES[number]) : 'en'];

  return (
    <>
      <div className="pointer-events-none relative z-[5] mx-auto max-w-6xl px-6 pt-24 pb-16 sm:pt-28 sm:pb-20">
        <h1 className="select-none font-extrabold tracking-[-0.02em] leading-[1.05] [font-size:clamp(2.2rem,6vw,4.6rem)] opacity-0 animate-hero-in">
          {copy.title}
        </h1>
        <p className="mt-4 max-w-3xl text-[0.98rem] sm:text-[1.06rem] leading-relaxed text-neutral-700 opacity-0 animate-hero-in-delayed">
          {copy.subtitle}
        </p>
      </div>

      {/* 语言切换移至全局布局挂载 */}
    </>
  );
}


