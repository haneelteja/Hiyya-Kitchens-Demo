/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // next lint only scans app/pages/components/lib/src by default — widen it to
    // scripts/ and tests/ so `pnpm lint` actually covers the whole codebase.
    dirs: ["app", "components", "lib", "hooks", "scripts", "tests"],
  },
};

export default nextConfig;
