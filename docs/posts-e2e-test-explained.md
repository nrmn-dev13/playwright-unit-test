# Penjelasan `e2e/posts.spec.ts`

File ini adalah **test End-to-End (E2E)** untuk halaman `/posts` (fitur CRUD). Test ini dijalankan oleh **Playwright**.

**Apa bedanya dengan unit test sebelumnya?**

| | Unit test (Vitest) | E2E test (Playwright) |
|---|---|---|
| Browser | Tiruan (jsdom) | **Asli** (Chromium) |
| Server Next.js | Tidak jalan | **Jalan** (`next dev`) |
| API | Dipalsukan | **Asli** (JSONPlaceholder sungguhan) |
| Yang diuji | Satu bagian kecil (fungsi/komponen) | **Seluruh alur**, dari buka halaman sampai data tampil |

**Ide utamanya:** Playwright membuka **browser sungguhan**, membuka halaman `/posts`, lalu melakukan hal yang sama seperti manusia: mengetik, klik tombol, menekan OK di dialog. Setelah itu ia mengecek apakah yang tampil di layar sudah benar.

> **Analogi:** unit test itu seperti mengecek mesin mobil satu per satu di bengkel. E2E test itu seperti **test drive**: mobil dirakit utuh, dinyalakan, lalu dibawa jalan sungguhan.

---

## Bagian 1: Import (baris 1)

```ts
import { expect, test } from "@playwright/test";
```

Mengambil dua alat utama dari Playwright:

| Alat | Kegunaan |
|---|---|
| `test` | Membuat satu test, juga untuk `test.beforeEach` |
| `expect` | Mengecek hasil: "saya harap layar menampilkan ini" |

Tidak perlu meng-import komponen atau fungsi API. Playwright menguji lewat **browser**, bukan lewat kode langsung.

---

## Bagian 2: Persiapan sebelum tiap test (baris 3–7)

```ts
test.beforeEach(async ({ page }) => {
```

`test.beforeEach` menjalankan kode di dalamnya **sebelum setiap test**.

`{ page }` adalah **tab browser** yang diberikan Playwright. Setiap test mendapat tab **baru yang bersih**, jadi test yang satu tidak mempengaruhi test lain.

```ts
  await page.goto("/posts");
```

Membuka halaman `/posts`. Alamat lengkapnya jadi `http://localhost:3000/posts`, karena `baseURL` sudah diatur di `playwright.config.ts`.

`await` artinya tunggu sampai halaman selesai dibuka.

```ts
  // Tunggu sampai daftar post dari JSONPlaceholder selesai dimuat.
```

Komentar penjelasan.

```ts
  await expect(page.getByTestId("post-item")).toHaveCount(10);
```

Menunggu sampai ada **10 kartu post** di layar.

- `getByTestId("post-item")` mencari semua elemen dengan `data-testid="post-item"`.
- `toHaveCount(10)` mengecek bahwa jumlahnya harus 10, karena halaman mengambil 10 post dari API.

**Kenapa baris ini penting?** Data diambil dari internet dan butuh waktu. Kalau tidak ditunggu, test bisa mulai klik-klik saat data belum ada.

**Keistimewaan Playwright:** `await expect(...)` **otomatis mencoba ulang** sampai kondisinya terpenuhi, maksimal 5 detik. Jadi kita tidak perlu menulis "tunggu 3 detik".

```ts
});
```

Selesai persiapan. Artinya setiap test di bawah **dimulai dari halaman `/posts` yang sudah berisi 10 post**.

---

## Test 1: Read, menampilkan daftar post (baris 9–12)

```ts
test("menampilkan daftar post (Read)", async ({ page }) => {
```

Membuat satu test. Teks di dalam tanda kutip adalah **nama test**, yang nanti muncul di laporan.

```ts
  await expect(page.getByRole("heading", { level: 1, name: "Posts CRUD" })).toBeVisible();
```

Mengecek bahwa judul halaman **"Posts CRUD"** terlihat.

- `getByRole("heading", ...)` mencari elemen **judul**.
- `level: 1` berarti judul tingkat 1, yaitu tag `<h1>`.
- `name: "Posts CRUD"` berarti teks judulnya harus "Posts CRUD".
- `toBeVisible()` berarti elemen itu harus **terlihat** di layar.

```ts
  await expect(page.getByTestId("post-item").first()).toContainText("#1");
});
```

Mengecek bahwa **kartu post pertama** berisi teks **"#1"**, yaitu post dengan id 1.

- `.first()` mengambil elemen **pertama** saja dari 10 kartu.
- `toContainText("#1")` berarti teksnya harus **mengandung** "#1". Tidak harus sama persis.

---

## Test 2: Create, menambah post baru (baris 14–22)

```ts
test("menambah post baru (Create)", async ({ page }) => {
  await page.getByLabel("Title").fill("Post dari Playwright");
```

- `getByLabel("Title")` mencari kolom input yang labelnya **"Title"**.
- `.fill(...)` mengisi kolom itu dengan teks "Post dari Playwright". Isi lama dihapus dulu, lalu teks baru dimasukkan sekaligus.

```ts
  await page.getByLabel("Body").fill("Isi post dari Playwright");
```

Sama, tapi untuk kolom **"Body"**.

```ts
  await page.getByRole("button", { name: "Tambah" }).click();
```

Mencari **tombol** bertuliskan "Tambah", lalu **klik**.

Di tahap ini browser benar-benar mengirim request `POST` ke JSONPlaceholder.

```ts
  await expect(page.getByRole("status")).toHaveText("Post berhasil dibuat.");
```

**Cek 1:** pesan sukses muncul.

Di komponen, pesan sukses punya `role="status"`. `toHaveText` berarti teksnya harus **sama persis**.

```ts
  await expect(page.getByTestId("post-item")).toHaveCount(11);
```

**Cek 2:** jumlah kartu post sekarang **11**: 10 dari awal ditambah 1 yang baru.

```ts
  await expect(page.getByTestId("post-item").first()).toContainText("Post dari Playwright");
});
```

**Cek 3:** post baru ada di **urutan paling atas**, karena komponen menaruh post baru di depan daftar.

---

## Test 3: Validasi form kosong (baris 24–30)

```ts
test("menampilkan error kalau form kosong", async ({ page }) => {
  await page.getByRole("button", { name: "Tambah" }).click();
```

Langsung klik **"Tambah"** tanpa mengisi form sama sekali.

```ts
  // Next.js juga punya elemen role="alert" tersembunyi, jadi saring berdasarkan teksnya.
  await expect(page.getByRole("alert").filter({ hasText: "Title dan body wajib diisi." })).toBeVisible();
```

**Cek 1:** pesan error muncul.

**Kenapa pakai `.filter(...)`?** Di halaman ada **2 elemen** dengan `role="alert"`:

1. Pesan error milik kita.
2. Elemen tersembunyi buatan Next.js (`__next-route-announcer__`), yang dipakai untuk membacakan perpindahan halaman ke pengguna tunanetra.

Playwright punya aturan **strict mode**: kalau sebuah pencarian menemukan lebih dari 1 elemen, test **gagal**, karena Playwright tidak tahu elemen mana yang kita maksud.

Karena itu kita persempit: "cari `role="alert"` yang **berisi teks** 'Title dan body wajib diisi.'" Hasilnya tinggal 1 elemen.

```ts
  await expect(page.getByTestId("post-item")).toHaveCount(10);
});
```

**Cek 2:** jumlah post **tetap 10**. Tidak ada post kosong yang ikut tertambah.

---

## Test 4: Update, mengubah post (baris 32–42)

```ts
test("mengubah post (Update)", async ({ page }) => {
  const firstPost = page.getByTestId("post-item").first();
```

Menyimpan "cara mencari kartu post pertama" ke variabel `firstPost`.

**Penting:** ini disebut **locator**. Locator **bukan** elemennya langsung, melainkan **petunjuk arah** untuk menemukannya. Playwright mencari ulang elemennya **setiap kali** locator dipakai. Hal ini berpengaruh di test Delete nanti.

```ts
  await firstPost.getByRole("button", { name: "Edit" }).click();
```

Klik tombol **"Edit"** yang ada **di dalam kartu post pertama**.

Menulis `firstPost.getByRole(...)` berarti "cari **hanya di dalam** `firstPost`". Ini penting karena setiap kartu punya tombol Edit sendiri. Kalau ditulis `page.getByRole("button", { name: "Edit" })`, Playwright akan menemukan 10 tombol dan gagal karena strict mode.

```ts
  await expect(page.getByRole("heading", { name: "Edit Post #1" })).toBeVisible();
```

Setelah klik Edit, judul form berubah menjadi **"Edit Post #1"**. Kita pastikan form sudah masuk mode edit sebelum mengetik.

```ts
  await page.getByLabel("Title").fill("Judul diubah Playwright");
```

Ganti isi kolom Title. `.fill()` otomatis menghapus judul lama dulu, jadi tidak perlu `clear()` seperti di unit test.

```ts
  await page.getByRole("button", { name: "Simpan" }).click();
```

Saat mode edit, tombolnya bertuliskan **"Simpan"**. Klik tombol itu. Browser mengirim request `PUT` ke JSONPlaceholder.

```ts
  await expect(page.getByRole("status")).toHaveText("Post berhasil diperbarui.");
```

**Cek 1:** pesan sukses muncul.

```ts
  await expect(firstPost).toContainText("Judul diubah Playwright");
});
```

**Cek 2:** kartu post pertama sekarang berisi **judul baru**.

---

## Test 5: Delete, menghapus post (baris 44–54)

```ts
test("menghapus post (Delete)", async ({ page }) => {
  // Playwright menutup dialog secara otomatis (sama dengan klik "Cancel"), jadi kita klik "OK".
  page.once("dialog", (dialog) => dialog.accept());
```

Saat tombol Hapus diklik, halaman menampilkan dialog **"Hapus post ini?"** (lewat `confirm()`).

**Perilaku default Playwright:** semua dialog otomatis **ditutup**, sama seperti menekan **Cancel**. Kalau baris ini tidak ada, post **tidak akan terhapus**.

- `page.once("dialog", ...)` berarti "saat dialog muncul **satu kali berikutnya**, jalankan fungsi ini".
- `dialog.accept()` menekan tombol **OK**.

Baris ini harus ditulis **sebelum** klik tombol Hapus, karena kita harus "siap menangkap" dialog sebelum dialognya muncul.

Tidak ada `await` di depannya, karena kita hanya **mendaftarkan** reaksi untuk nanti, bukan menunggu sesuatu.

```ts
  const firstPost = page.getByTestId("post-item").first();
  await firstPost.getByRole("button", { name: "Hapus" }).click();
```

Klik tombol **"Hapus"** di kartu post pertama (post #1). Dialog muncul, otomatis dijawab OK, lalu browser mengirim request `DELETE`.

```ts
  await expect(page.getByRole("status")).toHaveText("Post berhasil dihapus.");
```

**Cek 1:** pesan sukses muncul.

```ts
  await expect(page.getByTestId("post-item")).toHaveCount(9);
```

**Cek 2:** jumlah post tinggal **9**.

```ts
  await expect(page.getByTestId("post-item").first()).toContainText("#2");
});
```

**Cek 3:** karena post #1 sudah hilang, kartu **pertama** sekarang adalah post **#2**.

Seperti dijelaskan di test Update, locator selalu mencari ulang. Jadi `.first()` di sini menemukan kartu yang **sekarang** ada di urutan pertama, yaitu #2.

---

## Test 6: Kalau API gagal (baris 56–62)

```ts
test("menampilkan error kalau API gagal", async ({ page }) => {
  // Cegat request ke API dan balas dengan error 500.
  await page.route("**/posts?_limit=10", (route) => route.fulfill({ status: 500 }));
```

Ini fitur Playwright yang sangat berguna: **mencegat request jaringan**.

- `page.route(alamat, fungsi)` berarti "kalau browser meminta alamat ini, jangan kirim ke internet, biar saya yang menjawab".
- `"**/posts?_limit=10"` adalah pola alamat. `**` artinya "apa saja di depannya", jadi cocok dengan `https://jsonplaceholder.typicode.com/posts?_limit=10`.
- `route.fulfill({ status: 500 })` membalas dengan **status 500**, yaitu server error.

**Kenapa perlu dicegat?** JSONPlaceholder hampir tidak pernah error. Supaya bisa menguji tampilan saat server bermasalah, kita **pura-pura** servernya error.

```ts
  await page.reload();
```

**Muat ulang halaman.** Halaman sudah dibuka di `beforeEach` sebelum pencegat dipasang. Dengan reload, halaman meminta data lagi, dan kali ini request-nya **dicegat** dan dibalas error 500.

```ts
  await expect(page.getByRole("alert").filter({ hasText: "Request failed: 500" })).toBeVisible();
});
```

Mengecek bahwa pesan error **"Request failed: 500"** tampil di layar. Kita pakai `.filter` lagi karena elemen `role="alert"` milik Next.js juga ada di halaman.

---

## Ringkasan

| Test | Aksi di browser | Yang dicek |
|---|---|---|
| (beforeEach) | Buka `/posts` | 10 post sudah tampil |
| 1. Read | (tidak ada) | Judul "Posts CRUD" terlihat, post pertama #1 |
| 2. Create | Isi form, klik **Tambah** | Pesan sukses, total 11 post, post baru di atas |
| 3. Validasi | Klik **Tambah** tanpa isi | Pesan error, jumlah post tetap 10 |
| 4. Update | Klik **Edit**, ubah judul, klik **Simpan** | Pesan sukses, judul baru tampil |
| 5. Delete | Klik **Hapus**, jawab **OK** | Pesan sukses, sisa 9 post, pertama jadi #2 |
| 6. API gagal | Cegat API, reload | Pesan error "Request failed: 500" |

Pola **AAA** tetap berlaku:

1. **Arrange (siapkan):** buka halaman, pasang pencegat atau penjawab dialog.
2. **Act (jalankan):** isi form dan klik tombol.
3. **Assert (periksa):** `await expect(...)` untuk mengecek layar.

### Aksi yang sering dipakai

| Aksi | Contoh | Arti |
|---|---|---|
| `goto` | `page.goto("/posts")` | Buka halaman |
| `reload` | `page.reload()` | Muat ulang halaman |
| `fill` | `getByLabel("Title").fill("...")` | Isi kolom input (isi lama dihapus dulu) |
| `click` | `getByRole("button", ...).click()` | Klik elemen |
| `once("dialog")` | `page.once("dialog", d => d.accept())` | Jawab dialog confirm/alert berikutnya |
| `route` | `page.route("**/posts...", ...)` | Cegat request jaringan dan balas sendiri |

### Cara mencari elemen (locator)

| Locator | Contoh | Mencari berdasarkan |
|---|---|---|
| `getByRole` | `getByRole("button", { name: "Tambah" })` | Jenis elemen dan namanya (paling disarankan) |
| `getByLabel` | `getByLabel("Title")` | Label kolom input |
| `getByTestId` | `getByTestId("post-item")` | Atribut `data-testid` |
| `.first()` | `getByTestId("post-item").first()` | Ambil yang pertama saja |
| `.filter({ hasText })` | `getByRole("alert").filter({ hasText: "..." })` | Saring berdasarkan isi teks |
| `locator.getBy...` | `firstPost.getByRole("button", ...)` | Cari hanya di dalam elemen tertentu |

### Pengecekan (`expect`) yang sering dipakai

| Pengecekan | Arti |
|---|---|
| `toBeVisible()` | Elemen terlihat di layar |
| `toHaveText("...")` | Teks elemen **sama persis** |
| `toContainText("...")` | Teks elemen **mengandung** kata ini |
| `toHaveCount(n)` | Jumlah elemen yang ditemukan harus `n` |

### Kamus kecil

| Istilah | Arti |
|---|---|
| **E2E (End-to-End)** | Menguji aplikasi dari ujung ke ujung, seperti user sungguhan |
| **`page`** | Satu tab browser yang dikendalikan Playwright |
| **Locator** | Petunjuk untuk mencari elemen. Selalu mencari ulang setiap dipakai |
| **Strict mode** | Aturan Playwright: locator yang menemukan lebih dari 1 elemen akan membuat test gagal |
| **Auto-wait / auto-retry** | Playwright otomatis menunggu dan mencoba ulang sampai elemen siap (maks. 5 detik) |
| **`route` / intercept** | Mencegat request jaringan dan memberi jawaban palsu |

### Cara menjalankan

```bash
pnpm test:e2e                      # jalan di background (headless)
pnpm test:e2e --headed             # browser terlihat
pnpm test:e2e --ui                 # mode UI, enak untuk belajar langkah demi langkah
pnpm exec playwright show-report   # buka laporan HTML hasil test terakhir
```
