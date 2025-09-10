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
        <section className="relative z-10 pt-[28vh] pb-20 px-6">
          <div className="max-w-5xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              {t('heroTitle')}
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto">
              {t('heroDesc')}
            </p>
          </div>
        </section>
      )}
      <SectionsIntl />
    </>
  );
} 