import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import '@/i18n/request';
import { locales } from '@/lib/i18n/config';
import dynamic from 'next/dynamic';
import '../globals.css';
import Image from 'next/image';
import Link from 'next/link';
import LangSwitchPortal from '@/components/ui/LangSwitchPortal';
import type { Metadata } from 'next';
import Script from 'next/script';

const AnimatedCanvasLines = dynamic(() => import('../../../components/AnimatedCanvasLines'), { ssr: false });
const AnimatedLinesBackground = dynamic(() => import('../../../components/AnimatedLinesBackground'), { ssr: false });
const AnimatedSandParticles = dynamic(() => import('../../../components/AnimatedSandParticles'), { ssr: false });

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: { locale: 'en'|'ja'|'zh-TW'|string } }): Promise<Metadata> {
  const l = (params.locale === 'ja' || params.locale === 'zh-TW' || params.locale === 'en') ? params.locale : 'en';
  const meta = {
    en: {
      title: 'Crealize — Transforming Imagination into Reality',
      description: 'Data‑driven staged delivery for Web3 × Gamification × AI.'
    },
    ja: {
      title: 'Crealize — 想像を現実へ',
      description: 'Web3 × ゲーミフィケーション × AI をデータ起点で段階的に実装。'
    },
    'zh-TW': {
      title: 'Crealize — 把想像變成現實',
      description: '以數據驅動的分階段交付，專注 Web3 × 遊戲化 × AI。'
    }
  } as const;
  return {
    metadataBase: new URL('https://crealize.llc'),
    title: meta[l as 'en'|'ja'|'zh-TW'].title,
    description: meta[l as 'en'|'ja'|'zh-TW'].description,
    alternates: {
      canonical: `/${l}/`,
      languages: { en: '/en/', ja: '/ja/', 'zh-TW': '/zh-TW/', 'x-default': '/' }
    },
    openGraph: {
      title: meta[l as 'en'|'ja'|'zh-TW'].title,
      description: meta[l as 'en'|'ja'|'zh-TW'].description,
      url: `https://crealize.llc/${l}/`,
      siteName: 'Crealize',
      images: [{ url: `/og/og-${l}.jpg`, width: 1200, height: 630 }],
      type: 'website'
    },
    twitter: { card: 'summary_large_image' }
  };
}

export default async function LocaleLayout({
  children,
  params: { locale }
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const messages = await getMessages({ locale });

  return (
    <html lang={locale}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Crealize - Transforming Imagination into Reality</title>
        <meta name="description" content="Redefining the possibilities of creative realization with Web3 × Gamification × AI." />
        <link rel="icon" type="image/png" href="/image/crealize500.png" />
      </head>
      <body className="bg-white">
        <NextIntlClientProvider locale={locale} messages={messages}>
          {/* 左上角品牌：图标 + 标准字 */}
          <div className="fixed top-4 left-4 z-50 select-none">
            <Link href={`/${locale}`} aria-label="Go home" className="flex items-center gap-3 h-16">
              <Image src="/image/crealize500.png" alt="Crealize" width={64} height={64} priority className="block" style={{ objectFit: 'contain' }} />
              <span className="font-brand h-16 flex items-center" style={{ fontSize: 36, lineHeight: 1, transform: 'translateY(-8px)' }}>Crealize</span>
            </Link>
          </div>

          {/* 全局背景動畫（fixed） */}
          <AnimatedCanvasLines />
          <AnimatedLinesBackground />
          <AnimatedSandParticles />

          {/* 主要內容留白 */}
          <main id="main" className="content-area relative z-10" style={{ paddingTop: '100px', paddingBottom: '80px' }}>
            <div className="mx-auto w-full max-w-6xl px-8 md:px-12">
              {children}
            </div>
          </main>
          <div id="__lang-switch-floating__"></div>
          <LangSwitchPortal />
          {/* JSON-LD: Organization & WebSite */}
          <Script id="ld-org" type="application/ld+json" strategy="afterInteractive" dangerouslySetInnerHTML={{ __html: JSON.stringify({
            '@context':'https://schema.org', '@type':'Organization', name:'Crealize', url:'https://crealize.llc/', logo:'https://crealize.llc/image/crealize500.png'
          }) }} />
          <Script id="ld-website" type="application/ld+json" strategy="afterInteractive" dangerouslySetInnerHTML={{ __html: JSON.stringify({
            '@context':'https://schema.org', '@type':'WebSite', name:'Crealize', url:'https://crealize.llc/',
            potentialAction:{ '@type':'SearchAction', target:'https://crealize.llc/search?q={query}', 'query-input':'required name=query' }
          }) }} />
        </NextIntlClientProvider>
      </body>
    </html>
  );
} 