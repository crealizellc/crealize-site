'use client';

import { useTranslations } from 'next-intl';
import { BrandHeroText } from '@/components/BrandHeroText';
import AnimatedCanvasLines from '../../../components/AnimatedCanvasLines';

export default function HomePage() {
  const t = useTranslations();

  return (
    <div className="min-h-screen bg-white relative">
      {/* 動畫背景 */}
      <AnimatedCanvasLines />
      
      {/* Hero 區塊 */}
      <section className="relative z-10 pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <BrandHeroText text="Crealize" size="4em" />
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            {t('heroTitle')}
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto">
            {t('heroDesc')}
          </p>
        </div>
      </section>

      {/* Vision 區塊 */}
      <section className="relative z-10 py-20 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-12 text-center">
            {t('visionTitle')}
          </h2>
          <div className="space-y-6">
            {t.raw('vision').map((item: string, index: number) => (
              <p key={index} className="text-lg text-gray-700 leading-relaxed">
                {item}
              </p>
            ))}
          </div>
        </div>
      </section>

      {/* Projects 區塊 */}
      <section className="relative z-10 py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-12 text-center">
            {t('projectsTitle')}
          </h2>
          <div className="space-y-8">
            {t.raw('projects').map((item: string, index: number) => (
              <p key={index} className="text-lg text-gray-700 leading-relaxed">
                {item}
              </p>
            ))}
          </div>
        </div>
      </section>

      {/* Tech 區塊 */}
      <section className="relative z-10 py-20 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-12 text-center">
            {t('techTitle')}
          </h2>
          <div className="space-y-6">
            {t.raw('tech').map((item: string, index: number) => (
              <p key={index} className="text-lg text-gray-700 leading-relaxed">
                {item}
              </p>
            ))}
          </div>
        </div>
      </section>

      {/* Join 區塊 */}
      <section className="relative z-10 py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-12 text-center">
            {t('joinTitle')}
          </h2>
          <div className="space-y-6">
            {t.raw('join').map((item: string, index: number) => (
              <p key={index} className="text-lg text-gray-700 leading-relaxed">
                {item}
              </p>
            ))}
          </div>
        </div>
      </section>

      {/* Contact 區塊 */}
      <section className="relative z-10 py-20 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-12 text-center">
            {t('contactTitle')}
          </h2>
          <div className="space-y-4">
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