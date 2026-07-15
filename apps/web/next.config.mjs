/** @type {import('next').NextConfig} */
const nextConfig = {
    // Backpack's API sends no CORS headers, so the browser can't call it directly.
    // Proxy REST calls through the Next server instead.
    async rewrites() {
        return [
            {
                source: "/backpack-api/:path*",
                destination: "https://api.backpack.exchange/api/v1/:path*",
            },
        ];
    },
};

export default nextConfig;
