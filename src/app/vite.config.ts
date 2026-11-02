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
      // The app has no edge functions. Emulating them in dev starts a Deno server, which
      // fails with the Deno build Netlify's tooling finds on this machine.
      dev: { edgeFunctions: { enabled: false } },
    }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ],
})

export default config
