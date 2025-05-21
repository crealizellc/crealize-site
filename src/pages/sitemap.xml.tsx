import { GetServerSideProps } from 'next'
import { locales } from '@/lib/i18n/config'

const Sitemap = () => null

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const baseUrl = 'https://your-domain.com'
  
  // 生成所有页面的URL
  const pages = [
    '',
    '/about',
    '/contact',
    // 添加更多页面
  ]

  // 为每个语言生成URL
  const urls = pages.flatMap(page => 
    locales.map(locale => ({
      url: `${baseUrl}/${locale}${page}`,
      lastmod: new Date().toISOString(),
      changefreq: 'daily',
      priority: page === '' ? '1.0' : '0.8'
    }))
  )

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${urls.map(({ url, lastmod, changefreq, priority }) => `
        <url>
          <loc>${url}</loc>
          <lastmod>${lastmod}</lastmod>
          <changefreq>${changefreq}</changefreq>
          <priority>${priority}</priority>
        </url>
      `).join('')}
    </urlset>
  `

  res.setHeader('Content-Type', 'text/xml')
  res.write(sitemap)
  res.end()

  return {
    props: {}
  }
}

export default Sitemap 