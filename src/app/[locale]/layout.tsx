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

const META = {
  en: {
    title: 'Crealize — Web3 × Gamification × AI Product Studio',
    description: 'Tokyo-based product studio specializing in Telegram Mini Apps, Web3, GameFi and creator economy. 0→1 incubation, community growth, AI localization. Trusted by 10+ teams globally.',
    keywords: 'Telegram Mini App, Web3, GameFi, product studio, Tokyo, AI, gamification, creator economy, blockchain, TON, Solana',
  },
  ja: {
    title: 'Crealize — Telegram Mini App・Web3・AI プロダクトスタジオ（東京）',
    description: '東京発のプロダクトスタジオ。Telegram Mini App・GameFi・クリエイター支援に特化。0→1 インキュベーションからコミュニティ運用・AI 多言語化まで対応。10チーム以上の実績。',
    keywords: 'Telegram Mini App, Web3, GameFi, プロダクトスタジオ, 東京, AI, ゲーミフィケーション, クリエイター, TON, Solana',
  },
  'zh-TW': {
    title: 'Crealize — Web3 × 遊戲化 × AI 產品工作室（東京）',
    description: '東京產品工作室，專注 Telegram Mini App、Web3、GameFi 與創作者經濟。提供 0→1 孵化、社群運營、AI 多語系在地化。已服務 10+ 團隊。',
    keywords: 'Telegram Mini App, Web3, GameFi, 產品工作室, 東京, AI, 遊戲化, 創作者, TON, Solana',
  },
} as const;

type SupportedLocale = keyof typeof META;

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const l: SupportedLocale = (params.locale === 'ja' || params.locale === 'zh-TW') ? params.locale : 'en';
  const m = META[l];
  return {
    metadataBase: new URL('https://crealize.llc'),
    title: m.title,
    description: m.description,
    keywords: m.keywords,
    authors: [{ name: 'Yves CHEN', url: 'https://crealize.llc' }],
    robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
    alternates: {
      canonical: `/${l}/`,
      languages: { en: '/en/', ja: '/ja/', 'zh-TW': '/zh-TW/', 'x-default': '/ja/' },
    },
    openGraph: {
      title: m.title,
      description: m.description,
      url: `https://crealize.llc/${l}/`,
      siteName: 'Crealize',
      images: [{ url: `/og/og-${l}.jpg`, width: 1200, height: 630, alt: 'Crealize' }],
      locale: l === 'en' ? 'en_US' : l === 'ja' ? 'ja_JP' : 'zh_TW',
      type: 'website',
    },
    twitter: { card: 'summary_large_image', title: m.title, description: m.description },
  };
}

const LD_ORG = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Crealize',
  alternateName: 'Crealize LLC',
  url: 'https://crealize.llc/',
  logo: 'https://crealize.llc/image/crealize500.png',
  foundingDate: '2024-10-09',
  founder: { '@type': 'Person', name: 'Yves CHEN' },
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Ryusen 3-8-4-402',
    addressLocality: 'Taito-ku',
    addressRegion: 'Tokyo',
    postalCode: '110-0012',
    addressCountry: 'JP',
  },
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer support',
    url: 'https://t.me/yveschen',
  },
  sameAs: ['https://t.me/yveschen'],
};

const LD_WEBSITE = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Crealize',
  url: 'https://crealize.llc/',
};

const LD_FAQ = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What blockchain networks does Crealize support?',
      acceptedAnswer: { '@type': 'Answer', text: 'Crealize supports TON, Solana, and EVM-compatible chains (Ethereum, Polygon, BNB, and others). We integrate oracles, wallets, and cross-chain solutions as needed.' },
    },
    {
      '@type': 'Question',
      name: 'How does Crealize price its projects?',
      acceptedAnswer: { '@type': 'Answer', text: 'We use milestone-based pricing. Options include scope/fixed pricing, monthly ops retainers, or revenue-share arrangements for specific product lines.' },
    },
    {
      '@type': 'Question',
      name: 'How long does it take to build an MVP with Crealize?',
      acceptedAnswer: { '@type': 'Answer', text: 'Approximately 10–12 weeks for a production-ready MVP including analytics and event tracking. Go-to-Market takes an additional ~8 weeks.' },
    },
    {
      '@type': 'Question',
      name: 'How does Crealize measure project success?',
      acceptedAnswer: { '@type': 'Answer', text: 'We track D1/D7 retention, conversion rates, CAC, LTV, and campaign ROI. Results are reviewed every 4–12 weeks with detailed event analytics.' },
    },
  ],
};

const LD_SERVICE = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: 'Telegram Mini App & Web3 Product Development',
  provider: { '@type': 'Organization', name: 'Crealize', url: 'https://crealize.llc/' },
  serviceType: 'Product Studio',
  areaServed: 'Worldwide',
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Crealize Services',
    itemListElement: [
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: '0→1 Product Incubation' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Telegram Mini App Development' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Community & Channel Operations' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Full-Funnel Acquisition' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'AI Multilingual Localization' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Web3 / GameFi Development' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Ops Analytics & Automation' } },
    ],
  },
};

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
        <link rel="icon" type="image/png" href="/image/crealize500.png" />
      </head>
      <body className="bg-white">
        <NextIntlClientProvider locale={locale} messages={messages}>
          {/* ロゴ + ブランド名（左上固定） */}
          <div className="fixed top-4 left-4 z-50 select-none">
            <Link href={`/${locale}`} aria-label="Go home" className="flex items-center gap-3 h-16">
              <Image src="/image/crealize500.png" alt="Crealize" width={64} height={64} priority className="block" style={{ objectFit: 'contain' }} />
              <span className="font-brand h-16 flex items-center" style={{ fontSize: 36, lineHeight: 1, transform: 'translateY(-8px)' }}>Crealize</span>
            </Link>
          </div>

          {/* 背景アニメーション（fixed） */}
          <AnimatedCanvasLines />
          <AnimatedLinesBackground />
          <AnimatedSandParticles />

          {/* メインコンテンツ */}
          <main id="main" className="content-area relative z-10" style={{ paddingTop: '100px', paddingBottom: '80px' }}>
            <div className="mx-auto w-full max-w-6xl px-8 md:px-12">
              {children}
            </div>
          </main>
          <div id="__lang-switch-floating__"></div>
          <LangSwitchPortal />

          <Script id="ld-org" type="application/ld+json" strategy="afterInteractive"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(LD_ORG) }} />
          <Script id="ld-website" type="application/ld+json" strategy="afterInteractive"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(LD_WEBSITE) }} />
          <Script id="ld-faq" type="application/ld+json" strategy="afterInteractive"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(LD_FAQ) }} />
          <Script id="ld-service" type="application/ld+json" strategy="afterInteractive"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(LD_SERVICE) }} />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
