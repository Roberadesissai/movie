/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // Enables static HTML export
  distDir: 'build', // Custom build output directory
  images: {
    unoptimized: true, // Disable image optimization for exported static builds
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**', // Allows fetching images from any domain (replace with a specific hostname if needed)
        port: '', // Empty string allows any port
        pathname: '**', // Allows any path; adjust as needed for more specificity
      },
    ],
  },
};

module.exports = nextConfig;
