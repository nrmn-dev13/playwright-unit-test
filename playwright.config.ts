import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e", // folder tempat file test Playwright
  fullyParallel: true, // jalankan test secara paralel supaya cepat
  forbidOnly: !!process.env.CI, // di CI, gagal kalau ada test.only yang lupa dihapus
  retries: process.env.CI ? 2 : 0, // di CI, ulangi test yang gagal maksimal 2x
  reporter: "html", // buat laporan HTML setelah test selesai
  use: {
    baseURL: "http://localhost:3000", // supaya cukup tulis page.goto("/posts")
    trace: "on-first-retry", // rekam jejak test saat diulang, untuk debugging
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "next dev", // jalankan langsung, jangan "pnpm dev"
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
});
