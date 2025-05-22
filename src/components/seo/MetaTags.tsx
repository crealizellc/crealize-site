import Head from "next/head";
import { useRouter } from "next/router";
import { Locale } from "@/lib/i18n/config";

interface MetaTagsProps {
  title: string;
  description: string;
  keywords?: string;
  ogImage?: string;
  locale?: Locale;
  alternateLanguages?: {
    [key: string]: string;
  };
}

export function MetaTags({
  title,
  description,
  keywords,
  ogImage,
  locale = "ja",
  alternateLanguages,
}: MetaTagsProps) {
  const router = useRouter();
  const canonicalUrl = `https://your-domain.com${router.asPath}`;

  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}

      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={canonicalUrl} />
      {ogImage && <meta property="og:image" content={ogImage} />}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {ogImage && <meta name="twitter:image" content={ogImage} />}

      {/* Language */}
      <html lang={locale} />
      {alternateLanguages &&
        Object.entries(alternateLanguages).map(([lang, url]) => (
          <link key={lang} rel="alternate" hrefLang={lang} href={url} />
        ))}

      {/* Canonical URL */}
      <link rel="canonical" href={canonicalUrl} />
    </Head>
  );
}
