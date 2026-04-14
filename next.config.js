/** @type {import('next').NextConfig} */
const withNextIntl = require('next-intl/plugin')();

const isStaticExport = process.env.STATIC_EXPORT === 'true';

const nextConfig = {
  // GH Pages 静态导出时启用 export
  ...(isStaticExport ? { output: 'export' } : {}),
  images: {
    // GH Pages 需关闭优化
    unoptimized: true,
    formats: ['image/avif', 'image/webp'],
  },
  trailingSlash: true,
  compress: false,
  poweredByHeader: false,
  reactStrictMode: true,
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        minimize: true,
        splitChunks: {
          chunks: 'all',
          minSize: 20000,
          maxSize: 244000,
          minChunks: 1,
          maxAsyncRequests: 30,
          maxInitialRequests: 30,
          cacheGroups: {
            defaultVendors: {
              test: /[\\/]node_modules[\\/]/,
              priority: -10,
              reuseExistingChunk: true,
            },
            default: {
              minChunks: 2,
              priority: -20,
              reuseExistingChunk: true,
            },
          },
        },
      };
    }
    return config;
  },
};

module.exports = withNextIntl(nextConfig);