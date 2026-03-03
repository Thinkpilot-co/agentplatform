/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  serverExternalPackages: ["dockerode", "ws"],
};

export default nextConfig;
