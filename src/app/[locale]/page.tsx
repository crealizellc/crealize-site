'use client';

import { useTranslations } from 'next-intl';
import Hero from '@/components/Hero';
import SectionsIntl from '@/components/SectionsIntl';
import Script from 'next/script';
import { useLocale } from 'next-intl';

export default function HomePage() {
  const t = useTranslations();
  const locale = useLocale();
  const isEn = locale === 'en';

  return (
    <>
      {isEn ? <Hero /> : (
        <section className="relative z-10 pt-[28vh] pb-20">
          <h1 className="font-extrabold tracking-[-0.02em] leading-[1.05] [font-size:clamp(2.2rem,6vw,4.6rem)]">
            {t('heroTitle')}
          </h1>
          <p className="mt-4 max-w-3xl text-[0.98rem] sm:text-[1.06rem] leading-relaxed text-neutral-700">
            {t('heroDesc')}
          </p>
        </section>
      )}
      <SectionsIntl />
    </>
  );
} 