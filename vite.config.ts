import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "path";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";
import { VitePWA } from "vite-plugin-pwa";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

function stripAiStudioAttachments(): Plugin {
  return {
    name: "strip-aistudio-attachments",
    apply: "build",
    closeBundle() {
      const target = path.join(rootDir, "dist", "assets", "aistudio");
      if (fs.existsSync(target)) {
        fs.rmSync(target, { recursive: true, force: true });
      }
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      stripAiStudioAttachments(),
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: [
          "assets/app-icon/icon.png",
          "apple-touch-icon.png",
          "pwa-192x192.png",
          "pwa-512x512.png",
          "pwa-maskable-512x512.png",
          "dzikir-overrides.json",
          "etahlil-pembagian-halaman-dzikir.json",
          "assets/logo-mark.webp",
          "assets/logo-text.webp",
          "assets/collection-icon.webp",
          "assets/mosque-banner.webp",
          "assets/sounds/notif_shalat.wav",
          "assets/sounds/notif_update.wav",
          "assets/sounds/adzan.mp3",
          "assets/sounds/adzan_subuh.mp3",
        ],
        manifest: {
          id: "/",
          name: "e-Moeslife",
          short_name: "e-Moeslife",
          description:
            "Ruang baca Islami digital untuk tahlil, dzikir, Yasin, Ar-Rahman, Al-Qur'an, Tafsir, Jadwal Shalat, dan Kitab Kuning.",
          lang: "id",
          theme_color: "#134a35",
          background_color: "#ffffff",
          display: "standalone",
          orientation: "portrait",
          start_url: "/",
          scope: "/",
          icons: [
            {
              src: "/pwa-192x192.png",
              sizes: "192x192",
              type: "image/png",
              purpose: "any",
            },
            {
              src: "/pwa-512x512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "any",
            },
            {
              src: "/pwa-maskable-512x512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable",
            },
          ],
        },
        workbox: {
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
          globPatterns: ["**/*.{js,css,html,ico,png,webp,svg,woff,woff2}"],
          globIgnores: ["data/*.json", "assets/aistudio/**"],
          runtimeCaching: [
            {
              urlPattern: /\/data\/.*\.json$/i,
              handler: "StaleWhileRevalidate",
              options: {
                cacheName: "kitab-local-json-cache",
                expiration: {
                  maxEntries: 30,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/equran\.id\/api\/.*/i,
              handler: "StaleWhileRevalidate",
              options: {
                cacheName: "equran-api-cache",
                expiration: {
                  maxEntries: 250,
                  maxAgeSeconds: 60 * 60 * 24 * 30,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: "CacheFirst",
              options: {
                cacheName: "google-fonts-cache",
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: "CacheFirst",
              options: {
                cacheName: "gstatic-fonts-cache",
                expiration: {
                  maxEntries: 20,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
        devOptions: {
          enabled: true,
          type: "module",
        },
      }),
    ],
    resolve: {
      alias: {
        "@": rootDir,
      },
    },
    build: {
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes("node_modules")) return;
            if (id.includes("/react/") || id.includes("/react-dom/") || id.includes("/scheduler/")) {
              return "react-vendor";
            }
            if (id.includes("/@capacitor/")) {
              return "capacitor-vendor";
            }
            if (id.includes("/lucide-react/")) {
              return "icons-vendor";
            }
          },
        },
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== "true",
      watch: process.env.DISABLE_HMR === "true" ? null : {},
    },
  };
});
