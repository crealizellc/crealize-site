import { useEffect } from 'react';
import type { NextPage } from 'next';
import { locales, defaultLocale } from '../src/lib/i18n/config';

const IndexRedirect: NextPage = () => {
  useEffect(() => {
    try {
      const navigatorLang = (typeof navigator !== 'undefined' ? navigator.language : '')?.toLowerCase();
      const supported = locales.map((l) => l.toLowerCase());
      const matched = supported.find((l) => navigatorLang.startsWith(l));
      const target = matched ?? defaultLocale ?? 'en';
      const path = `/${target}/`;
      if (typeof window !== 'undefined' && window.location) {
        window.location.replace(path);
      }
    } catch {
      if (typeof window !== 'undefined' && window.location) {
        window.location.replace('/en/');
      }
    }
  }, []);

  return null;
};

export default IndexRedirect;