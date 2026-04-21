import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // build(vite): Strict port config is needed for predictable routing when developing
  server: {
    host: true,
    port: 5173,
    strictPort: true,
  },
});

// TODO: Configure proxy for API backend routing
