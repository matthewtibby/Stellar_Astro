/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'skyview.gsfc.nasa.gov',
      // add any other external domains you use for images
    ],
  },
}
module.exports = nextConfig 