import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: process.env.CERCA_BASE_PATH || "/",
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [{ name: "municipios", test: /municipalities/ }],
        },
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "icons/apple-touch-icon.png"],
      manifest: {
        id: "./",
        name: "CERCA · Encuentra tu lugar",
        short_name: "CERCA",
        description:
          "Alojamientos a tu medida y supermercados a un paseo. Explora España con CERCA.",
        lang: "es",
        start_url: "./",
        scope: "./",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#3970e8",
        icons: [
          {
            src: "icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "icons/icon-maskable.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,jpg,woff2,webmanifest}"],
        cleanupOutdatedCaches: true,
      },
    }),
  ],
});
