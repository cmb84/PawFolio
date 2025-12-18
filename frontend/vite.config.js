import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const devApiTarget = env.VITE_DEV_API_TARGET || "http://localhost:5000";

  return {
    root: ".",
    publicDir: "public",
    base: "/",
    plugins: [react()],
    server: {
      host: "0.0.0.0",
      port: 7012,
      strictPort: true,
      proxy: {
        "/api": {
          target: devApiTarget,
          changeOrigin: true,
          secure: false,
        },
        "/uploads": {
          target: devApiTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },
    preview: {
      host: "0.0.0.0",
      port: 7012,
    },
    build: {
      outDir: "dist",
      emptyOutDir: true,
    },
  };
});
