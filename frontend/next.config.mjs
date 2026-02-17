/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  swcMinify: true,

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'cloudflare-ipfs.com' },
      { protocol: 'https', hostname: 'mandessnack.shop' },
      { protocol: 'https', hostname: 'api.mandessnack.shop' }
    ],
  },

  // --- SOLUSI JALUR TIKUS (INTERNAL DOCKER) ---
  async rewrites() {
    return [
      {
        source: '/api/proxy/:path*',
        // ✅ KITA PAKSA LEWAT JALUR DALAM
        // 'backend' = nama service di docker-compose.yml
        // '4000' = port asli backend
        destination: 'http://backend:4000/api/:path*', 
      },
    ];
  },
  
  // Header ini PENTING agar Cookie diteruskan oleh Next.js ke Backend
  async headers() {
    return [
      {
        source: '/api/proxy/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: 'https://mandessnack.shop' }, // Lebih spesifik lebih baik
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS,PATCH' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, Cookie' }, // "Cookie" wajib ada
        ],
      },
    ];
  },
};

export default nextConfig;