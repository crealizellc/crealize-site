'use client';

import { useTranslations } from 'next-intl';
import { BrandHeroText } from '@/components/BrandHeroText';
// 背景動畫已移至 layout 統一渲染

export default function HomePage() {
  const t = useTranslations();

  return (
    <div className="min-h-screen relative">
      
      {/* Hero 區塊 */}
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