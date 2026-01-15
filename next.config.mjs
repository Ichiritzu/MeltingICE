
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: true, // Set to false to enable PWA in production; disabled for restricted build environment stability
  register: true,
  skipWaiting: true,
  workboxOptions: {
    disableDevLogs: true,
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',  // Static export for Cloudways
  reactStrictMode: true,
  images: {
    unoptimized: true,  // Required for static export
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  trailingSlash: true,
};

// export default withPWA(nextConfig);
export default nextConfig; // PWA Disabled for build stability. Uncomment above to enable.
