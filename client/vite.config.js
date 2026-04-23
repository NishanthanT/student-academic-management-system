import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // build: Consider enabling build.sourcemap: true during production debugging
  // build(vite): Strict port config is needed for predictable routing when developing
  server: {
    host: true,
    port: 5173,
    strictPort: true,
  },
});

// TODO: Configure proxy for API backend routing
