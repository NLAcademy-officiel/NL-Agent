/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Le rendu et le déploiement ciblent Vercel par défaut ; aucune
  // configuration spécifique n'est requise à ce stade (Phase 1).
  images: {
    remotePatterns: [],
  },
};

export default nextConfig;
