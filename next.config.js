/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'i.redd.it',
      'i.imgur.com',
      'preview.redd.it',
      'external-preview.redd.it',
      'ipfs.io',
      'gateway.pinata.cloud'
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    unoptimized: true
  },
}

module.exports = nextConfig 