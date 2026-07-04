/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["pdf-parse"],
  // Emit a self-contained server bundle for a slim production Docker image.
  output: "standalone",
};

export default nextConfig;
