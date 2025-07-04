import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { locales } from '@/lib/i18n/config';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';
import '../globals.css';

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
      </head>
      <body className="bg-white">
        <NextIntlClientProvider messages={messages}>
          {/* 語言切換器 - 固定在右上角 */}
          <div className="fixed top-4 right-4 z-50">
            <LanguageSwitcher />
          </div>
          
          {/* 主要內容 */}
          <main className="content-area">
            {children}
          </main>
        </NextIntlClientProvider>
      </body>
    </html>
  );
} 