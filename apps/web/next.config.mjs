/** @type {import('next').NextConfig} */
const nextConfig = {
    // Market data is proxied by the route handler in app/backpack-api, which
    // strips the browser headers the upstream edge rejects.
    reactStrictMode: true,
};

export default nextConfig;
