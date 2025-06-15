/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'skyview.gsfc.nasa.gov',
      'wxannuklwbocdheqhmbx.supabase.co', // Supabase storage domain for preview images
      // add any other external domains you use for images
    ],
  },
}
module.exports = nextConfig 