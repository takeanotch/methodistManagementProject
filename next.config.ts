import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
   headers: async () => [
    {
      source: '/(.*)',
      headers: [
        { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' }, // Force un rechargement propre des CSS/JS
      ],
    },
  ],
  
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb', // Augmente la limite pour les vidéos
    },
    optimizeCss: true, // (Laisse actif pour un CSS optimisé, mais surveille le rendu)
  },
   images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'api.placeholder.com'
      },
      {
        protocol: 'https',
        hostname: 'gjhzjadimrlvdjskpwvh.supabase.co'
      },
    ],
  },
};

export default nextConfig;
