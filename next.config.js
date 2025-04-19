/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: [], // Add your image domains here if needed
  },
  env: {
    // Add any environment variables that need to be exposed to the browser
  },
}

module.exports = nextConfig 