import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  /* config options here */
  webpack(config) {
    const projectNodeModules = path.join(process.cwd(), "node_modules");
    config.resolve.modules = [
      projectNodeModules,
      ...(config.resolve.modules ?? []),
    ];
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });
    return config;
  },
    
    turbopack: {
      resolveAlias: {
        tailwindcss: path.join(process.cwd(), "node_modules", "tailwindcss"),
      },
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  
};

export default nextConfig;
