import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Tree-shake icon/animation barrels so each page only ships what it imports.
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
  poweredByHeader: false,
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'images.unsplash.com' }],
  },
  webpack: (config, { isServer, webpack }) => {
    config.experiments = { ...config.experiments, asyncWebAssembly: true, layers: true }

    // --- @splinetool/runtime@2.x bundler workarounds -----------------------
    // 1) build/boolean.js does `new URL('boolean_wasm_bg.wasm', ...)` but the
    //    file it ships is named `boolean.wasm`.
    config.resolve.alias = {
      ...config.resolve.alias,
      'boolean_wasm_bg.wasm': path.resolve(
        __dirname,
        'node_modules/@splinetool/runtime/build/boolean.wasm'
      ),
    }

    // 2) It references ../libs/draco/* decoders that aren't in the package at
    //    all — they're loaded from Spline's CDN at runtime. Point the static
    //    references at a stub so webpack stops trying to resolve them.
    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(
        /libs[\/]draco[\/]/,
        path.resolve(__dirname, 'lib/empty-module.js')
      )
    )

    config.externals = config.externals ?? []
    if (Array.isArray(config.externals)) {
      config.externals.push({ 'utf-8-validate': 'commonjs utf-8-validate', bufferutil: 'commonjs bufferutil' })
      if (isServer) config.externals.push('@splinetool/runtime')
    }

    return config
  },
}

export default nextConfig
