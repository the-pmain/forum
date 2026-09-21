import path from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { connectAllowlist } from "./server/allowlist.ts";

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    {
      name: "ip-allowlist",
      configureServer(server) {
        server.middlewares.use(connectAllowlist);
      },
    },
    react(),
    tailwindcss(),
  ],
  root: path.join(root, "client"),
  envDir: root,
  resolve: {
    alias: {
      "@shared": path.join(root, "shared"),
    },
  },
  server: {
    port: 5173,
    fs: { allow: [root] },
    proxy: {
      "/api": {
        target: "http://127.0.0.1:3001",
        xfwd: true,
      },
    },
  },
  build: {
    outDir: path.join(root, "dist"),
    emptyOutDir: true,
  },
});
