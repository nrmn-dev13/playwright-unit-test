import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true, // supaya import "@/lib/..." bisa dibaca
  },
  test: {
    environment: "jsdom", // pakai browser tiruan
    globals: true,        // agar Testing Library otomatis membersihkan DOM setelah tiap test
  },
});
