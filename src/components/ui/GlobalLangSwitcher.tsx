'use client';
import {usePathname} from 'next/navigation';

const LOCALES = ['en','ja','zh-TW'] as const;

function swapLocale(path: string, target: string) {
  const seg = path.split('/').filter(Boolean);
  if (seg.length === 0) return `/${target}/`;
  if ((LOCALES as readonly string[]).includes(seg[0])) seg[0] = target; else seg.unshift(target);
  return '/' + seg.join('/') + (path.endsWith('/') ? '/' : '/');
}

export default function GlobalLangSwitcher(){
  const path = usePathname() || '/en/';
  return (
    <div className="fixed bottom-4 right-4 z-[100] pointer-events-auto">
      <div className="backdrop-blur supports-[backdrop-filter]:bg-white/55 bg-white/80 border border-neutral-200 rounded-full shadow-sm pl-3 pr-2 py-1 flex items-center gap-2 justify-end text-right min-w-[160px]">
        <a className="px-3 py-1 text-[12px] leading-none hover:underline" href={swapLocale(path,'en')}>EN</a>
        <span className="text-neutral-300">·</span>
        <a className="px-3 py-1 text-[12px] leading-none hover:underline" href={swapLocale(path,'ja')}>日本語</a>
        <span className="text-neutral-300">·</span>
        <a className="px-3 py-1 text-[12px] leading-none hover:underline" href={swapLocale(path,'zh-TW')}>繁體</a>
      </div>
    </div>
  );
}


