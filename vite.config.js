import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

export default defineConfig({
  plugins: [react()],
  base: "/EduardoPortf/",
  server: {
    host: '127.0.0.1',
    fs: {
      deny: ['.env', '.env.*', '**/.git/**', '**/references/**'],
    },
  },
})
