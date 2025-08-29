/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.imweb.me',
        port: '',
        pathname: '/thumbnail/**',
      },
    ],
  },
}

module.exports = nextConfig