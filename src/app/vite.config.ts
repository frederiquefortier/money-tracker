import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import netlify from '@netlify/vite-plugin-tanstack-start'

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    devtools(),
    netlify({
      // No edge functions; emulating them needs a Deno that fails on this machine.
      dev: { edgeFunctions: { enabled: false } },
    }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ],
})

export default config
