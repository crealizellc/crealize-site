'use client';
import {useLocale} from 'next-intl';
import zh from '@/content/homeContent.zh-TW';
import en from '@/content/homeContent.en';
import ja from '@/content/homeContent.ja';

const SKIP_TITLES = [
  'Transforming Imagination into Reality',
  '把想像變成現實',
  '將想像力變為現實',
  '想像を現実へ',
  '想像力を現実に変える'
];

export default function SectionsIntl(){
  const raw = useLocale();
  const norm = (raw || 'en').replace('_','-');
  const data = norm === 'ja' ? ja : norm === 'zh-TW' || norm.startsWith('zh') ? zh : en;
  const sections = (data.sections || []).filter((s:any)=>!SKIP_TITLES.includes(String(s.title||'')));
  return (
    <div className="pb-16">
      {sections.map((s:any) => (
        <section key={s.id} className="mb-16">
          <h2 className="text-neutral-900 font-[800] tracking-[-0.01em] leading-tight [font-size:clamp(1.7rem,2.9vw,2.3rem)]">
            {s.title}
          </h2>
          <div className="mt-4 space-y-[0.65rem]">
            {s.content.map((p:string, i:number) => (
              <p key={i} className="text-[1rem] sm:text-[1.075rem] leading-relaxed text-neutral-700">{p}</p>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}


