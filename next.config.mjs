/** @type {import('next').NextConfig} */
const nextConfig = {
    // API routes are now built-in — no proxy needed
    serverExternalPackages: ['sequelize', 'pg', 'pg-hstore'],
};

export default nextConfig;
