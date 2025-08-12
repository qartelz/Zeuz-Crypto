import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import svgr from 'vite-plugin-svgr'
import tailwindcss from '@tailwindcss/vite' // Needs Tailwind v4

export default defineConfig({
  plugins: [
    react(),
    svgr(),
    tailwindcss(),
  ],
})
