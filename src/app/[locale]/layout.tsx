import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import '@/i18n/request';
import { locales } from '@/lib/i18n/config';
import dynamic from 'next/dynamic';
import '../globals.css';
import Image from 'next/image';
import Link from 'next/link';

const AnimatedCanvasLines = dynamic(() => import('../../../components/AnimatedCanvasLines'), { ssr: false });
const AnimatedLinesBackground = dynamic(() => import('../../../components/AnimatedLinesBackground'), { ssr: false });
const AnimatedSandParticles = dynamic(() => import('../../../components/AnimatedSandParticles'), { ssr: false });

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
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
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:bg-white focus:px-3 focus:py-2 focus:rounded">Skip to main content</a>
        <NextIntlClientProvider messages={messages}>
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
        </NextIntlClientProvider>
      </body>
    </html>
  );
} 