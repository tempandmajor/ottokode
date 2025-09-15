/** @type {import('next').NextConfig} */
const nextConfig = {
  // Performance optimizations
  reactStrictMode: true,
  swcMinify: true,

  // ESLint configuration
  eslint: {
    ignoreDuringBuilds: false, // Enable for production
  },

  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: false,
  },

  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    domains: ['avatars.githubusercontent.com', 'github.com'],
    minimumCacheTTL: 60,
    unoptimized: process.env.NODE_ENV === 'development', // Only for dev
  },

  // Experimental features for better performance
  experimental: {
    serverComponentsExternalPackages: ['@supabase/supabase-js'],
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
    webVitalsAttribution: ['CLS', 'LCP'],
  },

  // Webpack optimizations
  webpack: (config, { buildId, dev, isServer }) => {
    // Monaco Editor worker support
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }

    // Bundle analyzer for optimization
    if (process.env.ANALYZE === 'true') {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'server',
          analyzerPort: 8888,
          openAnalyzer: true,
        })
      );
    }

    return config;
  },

  // Build output optimization
  output: process.env.TAURI_BUILD ? 'export' : 'standalone',

  // Skip SSG for Tauri builds to avoid Supabase issues
  ...(process.env.TAURI_BUILD && {
    trailingSlash: true,
    skipTrailingSlashRedirect: true,
    images: {
      unoptimized: true,
    },
  }),

  // Compression
  compress: true,

  // Generate build ID for cache busting
  generateBuildId: async () => {
    return process.env.VERCEL_GIT_COMMIT_SHA || `build-${Date.now()}`;
  },

  // Security and performance headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          }
        ],
      },
      // Static assets caching
      {
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  // Redirects for better UX
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
      {
        source: '/editor',
        destination: '/ide',
        permanent: true,
      },
      {
        source: '/signin',
        destination: '/login',
        permanent: true,
      },
    ];
  },

  // Rewrites for API proxying if needed
  async rewrites() {
    return [
      {
        source: '/api/health',
        destination: '/api/health',
      },
    ];
  },
}

module.exports = nextConfig