'use client';

import { useTranslations } from 'next-intl';
import Hero from '@/components/Hero';
import Script from 'next/script';

export default function HomePage() {
  const t = useTranslations();

  const isEn = typeof window !== 'undefined' ? window.location.pathname.split('/')[1] === 'en' : false;

  return (
    <div className="min-h-screen relative">
      {isEn && (
        <>
          <Hero />
          <Script id="ld-org" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
            '@context': 'https://schema.org', '@type': 'Organization', name: 'Crealize', url: 'https://your-domain.com/', logo: 'https://your-domain.com/logo.png'
          }) }} />
          <Script id="ld-website" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
            '@context': 'https://schema.org', '@type': 'WebSite', name: 'Crealize', url: 'https://your-domain.com/',
            potentialAction: { '@type': 'SearchAction', target: 'https://your-domain.com/search?q={query}', 'query-input': 'required name=query' }
          }) }} />
        </>
      )}
      {/* Hero 區塊（其他語言沿用原結構）*/}
      {!isEn && (
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

      {/* Vision 區塊 */}
      <section className="relative z-10 py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-12 text-center">
            {t('visionTitle')}
          </h2>
          <div className="space-y-6 px-2 md:px-4">
            {t.raw('vision').map((item: string, index: number) => (
              <p key={index} className="text-lg text-gray-700 leading-relaxed">
                {item}
              </p>
            ))}
          </div>
        </div>
      </section>

      {/* Projects 區塊 */}
      <section className="relative z-10 py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-12 text-center">
            {t('projectsTitle')}
          </h2>
          <div className="space-y-8 px-2 md:px-4">
            {t.raw('projects').map((item: string, index: number) => (
              <p key={index} className="text-lg text-gray-700 leading-relaxed">
                {item}
              </p>
            ))}
          </div>
        </div>
      </section>

      {/* Tech 區塊 */}
      <section className="relative z-10 py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-12 text-center">
            {t('techTitle')}
          </h2>
          <div className="space-y-6 px-2 md:px-4">
            {t.raw('tech').map((item: string, index: number) => (
              <p key={index} className="text-lg text-gray-700 leading-relaxed">
                {item}
              </p>
            ))}
          </div>
        </div>
      </section>

      {/* Join 區塊 */}
      <section className="relative z-10 py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-12 text-center">
            {t('joinTitle')}
          </h2>
          <div className="space-y-6 px-2 md:px-4">
            {t.raw('join').map((item: string, index: number) => (
              <p key={index} className="text-lg text-gray-700 leading-relaxed">
                {item}
              </p>
            ))}
          </div>
        </div>
      </section>

      {/* Contact 區塊 */}
      <section className="relative z-10 py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-12 text-center">
            {t('contactTitle')}
          </h2>
          <div className="space-y-4 px-2 md:px-4">
            {t.raw('contact').map((item: string, index: number) => (
              <p key={index} className="text-lg text-gray-700">
                {item}
              </p>
            ))}
            <p className="text-lg text-gray-700 mt-6">
              <a 
                href="https://t.me/yveschen" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                {t('telegram')}
              </a>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
} 