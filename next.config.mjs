/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The photobooth relies on getUserMedia, the File System Access API, and
  // Web Share Level 2 — all of which require a secure context (HTTPS) in
  // production. Localhost is exempt during development.
};

export default nextConfig;
