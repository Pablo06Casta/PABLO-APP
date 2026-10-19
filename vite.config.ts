import { readFileSync } from "node:fs";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

const datasets: Record<string, string> = {
  "osm-stays.json": "src/data/real/osm-stays.json",
  "venue-markets.json": "src/data/real/venue-markets.json",
  "granada-markets.json": "src/data/real/granada-markets.json",
  "venues.json": "src/data/venues.json",
  "market-exclusions.json": "src/data/real/market-exclusions.json",
  "osm-stays-exclusions.json": "src/data/real/osm-stays-exclusions.json",
  "municipalities-NOTICE.md": "src/data/NOTICE.md",
};

export default defineConfig({
  base: process.env.CERCA_BASE_PATH || "/",
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: "municipios", test: /municipalities/ },
            { name: "alojamientos", test: /real\/stays\.json/ },
          ],
        },
      },
    },
  },
  plugins: [
    {
      name: "public-data-licences",
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const pathname = new URL(req.url ?? "/", "http://localhost").pathname;
          const match = pathname.match(/\/data\/([^/]+)$/);
          const name = match?.[1] ?? "";
          if (!Object.hasOwn(datasets, name)) return next();
          res.setHeader(
            "Content-Type",
            name.endsWith(".json")
              ? "application/json; charset=utf-8"
              : "text/plain; charset=utf-8",
          );
          res.end(
            readFileSync(new URL(datasets[name], import.meta.url), "utf8"),
          );
        });
      },
      generateBundle() {
        for (const [name, path] of Object.entries(datasets)) {
          this.emitFile({
            type: "asset",
            fileName: `data/${name}`,
            source: readFileSync(new URL(path, import.meta.url), "utf8"),
          });
        }
      },
    },
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "icons/apple-touch-icon.png"],
      manifest: {
        id: "./",
        name: "CERCA · Encuentra tu lugar",
        short_name: "CERCA",
        description:
          "Viajes de bádminton: alojamientos y supermercados cerca de tu pabellón.",
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
