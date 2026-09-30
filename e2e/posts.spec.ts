import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/posts");
  // Tunggu sampai daftar post dari JSONPlaceholder selesai dimuat.
  await expect(page.getByTestId("post-item")).toHaveCount(10);
});

test("menampilkan daftar post (Read)", async ({ page }) => {
  await expect(page.getByRole("heading", { level: 1, name: "Posts CRUD" })).toBeVisible();
  await expect(page.getByTestId("post-item").first()).toContainText("#1");
});

test("menambah post baru (Create)", async ({ page }) => {
  await page.getByLabel("Title").fill("Post dari Playwright");
  await page.getByLabel("Body").fill("Isi post dari Playwright");
  await page.getByRole("button", { name: "Tambah" }).click();

  await expect(page.getByRole("status")).toHaveText("Post berhasil dibuat.");
  await expect(page.getByTestId("post-item")).toHaveCount(11);
  await expect(page.getByTestId("post-item").first()).toContainText("Post dari Playwright");
});

test("menampilkan error kalau form kosong", async ({ page }) => {
  await page.getByRole("button", { name: "Tambah" }).click();

  // Next.js juga punya elemen role="alert" tersembunyi, jadi saring berdasarkan teksnya.
  await expect(page.getByRole("alert").filter({ hasText: "Title dan body wajib diisi." })).toBeVisible();
  await expect(page.getByTestId("post-item")).toHaveCount(10);
});

test("mengubah post (Update)", async ({ page }) => {
  const firstPost = page.getByTestId("post-item").first();
  await firstPost.getByRole("button", { name: "Edit" }).click();

  await expect(page.getByRole("heading", { name: "Edit Post #1" })).toBeVisible();
  await page.getByLabel("Title").fill("Judul diubah Playwright");
  await page.getByRole("button", { name: "Simpan" }).click();

  await expect(page.getByRole("status")).toHaveText("Post berhasil diperbarui.");
  await expect(firstPost).toContainText("Judul diubah Playwright");
});

test("menghapus post (Delete)", async ({ page }) => {
  // Playwright menutup dialog secara otomatis (sama dengan klik "Cancel"), jadi kita klik "OK".
  page.once("dialog", (dialog) => dialog.accept());

  const firstPost = page.getByTestId("post-item").first();
  await firstPost.getByRole("button", { name: "Hapus" }).click();

  await expect(page.getByRole("status")).toHaveText("Post berhasil dihapus.");
  await expect(page.getByTestId("post-item")).toHaveCount(9);
  await expect(page.getByTestId("post-item").first()).toContainText("#2");
});

test("menampilkan error kalau API gagal", async ({ page }) => {
  // Cegat request ke API dan balas dengan error 500.
  await page.route("**/posts?_limit=10", (route) => route.fulfill({ status: 500 }));
  await page.reload();

  await expect(page.getByRole("alert").filter({ hasText: "Request failed: 500" })).toBeVisible();
});
