/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'export',
    distDir: 'build',
    images: {
      unoptimized: true,
      // Remove or comment out the old domains config
      // domains: ['example.com'],
      
      // Add remotePatterns instead
      remotePatterns: [
        {
          protocol: 'https',
          hostname: '**', // Replace with your specific domain
          port: '',
          pathname: '**',
        },
      ],
    }
  };
  
  module.exports = nextConfig; 