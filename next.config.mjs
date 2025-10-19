/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // ATENÇÃO: A otimização de imagens foi REATIVADA.
    // A linha "unoptimized: true" foi removida.
    // Isso é crucial para a performance.
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.ibb.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'image.tmdb.org',
        port: '',
        pathname: '/**',
      },
       {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Esta parte ignora os erros de ESLint durante o build
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;