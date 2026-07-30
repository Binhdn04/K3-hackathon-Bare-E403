/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // PDF.js loads its fake worker relative to its own module on Node.js.
    // Keeping the package external preserves that path instead of moving the
    // main module into .next/server/vendor-chunks without its worker file.
    serverComponentsExternalPackages: ["pdfjs-dist"]
  }
};

export default nextConfig;
