import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
    dedupe: ["react", "react-dom"],
  },
  server: {
    host: true,
    port: 5174,
    strictPort: true,
    watch: {
      usePolling: true,
    },
    // Let Vite auto-detect the HMR WebSocket connection.
    // Explicit host/protocol/port overrides here caused the
    // "failed to connect to websocket" errors on Windows.
    hmr: true,
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  optimizeDeps: {
    // Do NOT pre-bundle FullCalendar — its deep ESM internal views
    // (e.g. DayTimeColsView, DayGrid, TimeGrid) break under esbuild's
    // CJS/ESM interop layer and throw "cannot be invoked without 'new'".
    // React itself still benefits from pre-bundling.
    include: ["react", "react-dom"],
    exclude: [
      "@fullcalendar/react",
      "@fullcalendar/core",
      "@fullcalendar/daygrid",
      "@fullcalendar/timegrid",
      "@fullcalendar/list",
      "@fullcalendar/interaction",
    ],
    force: true,
  },
});
