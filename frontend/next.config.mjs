/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  swcMinify: true,

  // Config Gambar Kamu
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cloudflare-ipfs.com',
      },
      {
        protocol: 'https',
        hostname: process.env.NEXT_PUBLIC_APP_HOSTNAME || 'mandessnack.shop',
      },
      {
        protocol: 'https',
        hostname: process.env.NEXT_PUBLIC_API_HOSTNAME || 'api.mandessnack.shop',
      }
    ],
  },

  // --- INI BAGIAN PENTINGNYA (JALUR TIKUS) ---
  async rewrites() {
    return [
      {
        // Frontend nembak ke sini: /api/proxy/admin/login
        source: '/api/proxy/:path*',
        // Next.js oper ke sini: https://api.../api/admin/login
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'https://api.mandessnack.shop'}/api/:path*`, 
      },
    ];
  },
  
  // Headers ini opsional kalau sudah pakai rewrite, 
  // tapi kita pasang saja biar browser gak rewel soal CORS.
  async headers() {
    return [
      {
        source: '/api/proxy/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization' },
        ],
      },
    ];
  },
};

export default nextConfig;