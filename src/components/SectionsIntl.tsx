'use client';
import {useLocale} from 'next-intl';
import zh from '@/content/homeContent.zh-TW';
import en from '@/content/homeContent.en';
import ja from '@/content/homeContent.ja';

export default function SectionsIntl(){
  const raw = useLocale();
  const norm = (raw || 'en').replace('_','-');
  const data = norm === 'ja' ? ja : norm === 'zh-TW' || norm.startsWith('zh') ? zh : en;
  return (
    <div className="mx-auto max-w-6xl px-6 pb-16">
      {data.sections.map((s:any) => (
        <section key={s.id} className="mb-14">
          <h2 className="text-neutral-900 font-[800] tracking-[-0.01em] leading-tight [font-size:clamp(1.6rem,2.8vw,2.25rem)]">
            {s.title}
          </h2>
          <div className="mt-4 space-y-2">
            {s.content.map((p:string, i:number) => (
              <p key={i} className="text-[0.98rem] sm:text-[1.06rem] leading-relaxed text-neutral-700">{p}</p>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}


