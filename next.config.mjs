/** @type {import('next').NextConfig} */
const nextConfig = {
  // Les photos des joueurs proviennent du Storage Supabase (domaine propre à
  // chaque projet) : on sert les images sans le pipeline d'optimisation Next.
  images: { unoptimized: true },
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
    ];
  },
};

export default nextConfig;
