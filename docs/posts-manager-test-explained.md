# Penjelasan `posts-manager.test.tsx`

File ini menguji komponen [`src/app/posts/posts-manager.tsx`](../src/app/posts/posts-manager.tsx), yaitu tampilan CRUD yang berisi form tambah/edit dan daftar post dengan tombol Edit/Hapus.

**Bedanya dengan [`posts-api.test.ts`](./posts-api-test-explained.md):**

| `posts-api.test.ts` | `posts-manager.test.tsx` |
|---|---|
| Menguji **fungsi** biasa | Menguji **tampilan** (komponen React) |
| Yang dipalsukan: `fetch` | Yang dipalsukan: **seluruh fungsi API** (`getPosts`, `createPost`, dll.) |
| Cek: "apakah fetch dipanggil dengan benar?" | Cek: "apakah yang **terlihat di layar** sudah benar?" |

**Ide utamanya:** komponen di-render di **browser tiruan** (jsdom). Lalu kita berperan sebagai **user**: mengetik di form, klik tombol, dan melihat apakah layar berubah sesuai harapan.

> **Analogi:** seperti menguji mesin kasir tanpa menyambungkannya ke gudang sungguhan. Gudangnya kita ganti dengan "gudang pura-pura" yang jawabannya sudah kita tentukan. Yang kita uji hanya: apakah tombol dan layar kasirnya bekerja dengan benar?

---

## Bagian 1: Import (baris 1–5)

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";
```

Alat-alat dari **Vitest**. Sama seperti file sebelumnya, tapi kali ini pakai `beforeEach`, yang menjalankan kode **sebelum** setiap test dimulai.

```ts
import { render, screen, within } from "@testing-library/react";
```

Alat dari **React Testing Library**:

| Alat | Kegunaan |
|---|---|
| `render` | Menampilkan komponen di browser tiruan |
| `screen` | "Layar": tempat mencari elemen yang sedang tampil |
| `within` | Mencari elemen **hanya di dalam** bagian tertentu, misalnya di dalam satu kartu post saja |

```ts
import userEvent from "@testing-library/user-event";
```

Alat untuk **meniru aksi user**: mengetik, klik, menghapus teks, dan sebagainya.

```ts
import PostsManager from "./posts-manager";
```

Komponen **asli** yang mau diuji.

```ts
import * as api from "@/lib/posts-api";
```

Mengambil **semua** isi file `posts-api` dan mengumpulkannya dalam satu nama: `api`. Jadi nanti bisa ditulis `api.getPosts`, `api.createPost`, dan seterusnya.

Karena ada `vi.mock` di bawah, yang kita dapat di sini adalah **versi palsunya**.

---

## Bagian 2: Memalsukan modul API (baris 7–17)

```ts
// Ganti fungsi API dengan mock, tapi pertahankan konstanta seperti MAX_REMOTE_ID.
```

Komentar penjelasan.

```ts
vi.mock("@/lib/posts-api", async (importOriginal) => {
```

`vi.mock` artinya: "setiap kali ada kode yang meng-import `@/lib/posts-api`, berikan **versi buatan saya**, bukan yang asli."

Ini berlaku juga untuk komponen `PostsManager`. Jadi saat komponen memanggil `getPosts()`, yang terpanggil adalah versi palsu.

`importOriginal` adalah fungsi untuk mengambil versi **asli** modul itu, kalau kita masih butuh sebagian isinya.

```ts
  const actual = await importOriginal<typeof import("@/lib/posts-api")>();
```

Mengambil isi **asli** modul dan menyimpannya di `actual`.

Bagian `<typeof import(...)>` hanya untuk TypeScript, supaya ia tahu bentuk isi modul. Bagian ini tidak mempengaruhi cara kerja test.

```ts
  return {
    ...actual,
```

`...actual` artinya **salin semua isi asli** ke sini, termasuk `MAX_REMOTE_ID` (angka 100) yang dipakai komponen untuk membedakan post dari server dan post buatan lokal.

```ts
    getPosts: vi.fn(),
    createPost: vi.fn(),
    updatePost: vi.fn(),
    deletePost: vi.fn(),
  };
});
```

Lalu **timpa** keempat fungsi API dengan fungsi palsu (`vi.fn()`). Hasil akhirnya: konstanta tetap asli, sedangkan fungsi-fungsi yang memanggil internet diganti dengan tiruan.

---

## Bagian 3: Data contoh (baris 19–22)

```ts
const samplePosts = [
  { id: 1, userId: 1, title: "Post pertama", body: "Isi pertama" },
  { id: 2, userId: 1, title: "Post kedua", body: "Isi kedua" },
];
```

Dua post contoh yang akan "dikirim server palsu" setiap kali komponen meminta daftar post.

---

## Bagian 4: Persiapan sebelum tiap test (baris 24–27)

```ts
beforeEach(() => {
```

Kode di dalamnya dijalankan **sebelum setiap test**.

```ts
  vi.resetAllMocks();
```

Membersihkan **semua** mock: catatan panggilan dan balasan yang pernah diatur. Supaya test yang satu tidak terpengaruh test sebelumnya.

```ts
  vi.mocked(api.getPosts).mockResolvedValue(samplePosts);
});
```

Mengatur `getPosts` palsu supaya **selalu** membalas dengan `samplePosts`.

- `vi.mocked(...)` hanya untuk TypeScript, supaya ia tahu `api.getPosts` sekarang adalah fungsi palsu yang punya method seperti `mockResolvedValue`.
- `mockResolvedValue` (tanpa `Once`) berarti balasan ini dipakai untuk **setiap** panggilan, bukan hanya panggilan pertama.

Baris ini ditulis di `beforeEach` karena **semua** test butuh daftar post saat komponen pertama kali tampil.

---

## Bagian 5: Kelompok test (baris 29)

```ts
describe("PostsManager", () => {
```

Membungkus semua test komponen dalam satu kelompok bernama `"PostsManager"`.

---

## Test 1: Read, menampilkan daftar post (baris 30–36)

```ts
  it("menampilkan daftar post dari API (Read)", async () => {
    render(<PostsManager />);
```

Menampilkan komponen di browser tiruan. Saat pertama muncul, komponen langsung memanggil `getPosts()` (yang palsu).

```ts
    expect(screen.getByText("Memuat data...")).toBeDefined();
```

Tepat setelah render, data belum datang, jadi layar harus menampilkan tulisan **"Memuat data..."**.

`getByText` langsung mencari teks itu di layar. Kalau tidak ketemu, test langsung gagal.

```ts
    expect(await screen.findByText("Post pertama")).toBeDefined();
```

`findByText` **menunggu** sampai teks muncul (maksimal sekitar 1 detik). Kita pakai `find` karena data datang secara async, jadi butuh waktu sebentar.

Kalau "Post pertama" muncul, berarti data dari API sudah tampil.

```ts
    expect(screen.getAllByTestId("post-item")).toHaveLength(2);
  });
```

`getAllByTestId("post-item")` mencari **semua** elemen yang punya `data-testid="post-item"`, yaitu setiap kartu post. Jumlahnya harus **2**, sesuai `samplePosts`.

---

## Test 2: Create, menambah post baru (baris 38–52)

```ts
  it("menambah post baru (Create)", async () => {
    const user = userEvent.setup();
```

Membuat "user tiruan" yang nanti bisa mengetik dan klik.

```ts
    vi.mocked(api.createPost).mockResolvedValue({ id: 101, userId: 1, title: "Post baru", body: "Isi baru" });
```

Mengatur `createPost` palsu: kalau dipanggil, balas seolah server berhasil membuat post dengan `id: 101`.

```ts
    render(<PostsManager />);
    await screen.findByText("Post pertama");
```

Tampilkan komponen, lalu **tunggu sampai loading selesai** (daftar post sudah muncul). Kalau tidak ditunggu, kita bisa mengisi form saat data belum datang, dan hasilnya jadi kacau.

```ts
    await user.type(screen.getByLabelText("Title"), "Post baru");
```

- `getByLabelText("Title")` mencari input yang labelnya **"Title"**, seperti user mencari kolom berdasarkan tulisan di atasnya.
- `user.type(...)` mengetik "Post baru" ke dalamnya, huruf demi huruf.
- `await` diperlukan karena mengetik butuh waktu.

```ts
    await user.type(screen.getByLabelText("Body"), "Isi baru");
```

Sama, tapi untuk kolom **"Body"**.

```ts
    await user.click(screen.getByRole("button", { name: "Tambah" }));
```

Klik tombol bertuliskan **"Tambah"**.

`getByRole("button", { name: "Tambah" })` artinya "cari **tombol** yang namanya Tambah". Cara ini lebih baik daripada mencari lewat class CSS, karena mirip cara user melihat halaman.

```ts
    expect(api.createPost).toHaveBeenCalledWith({ title: "Post baru", body: "Isi baru" });
```

**Cek 1:** komponen memanggil `createPost` dengan data yang diketik user.

```ts
    expect(await screen.findByText("Post baru")).toBeDefined();
```

**Cek 2:** post baru **muncul di daftar**. Pakai `findBy` karena perlu menunggu sebentar.

```ts
    expect(screen.getByRole("status").textContent).toBe("Post berhasil dibuat.");
```

**Cek 3:** pesan sukses tampil.

Di komponen, pesan sukses punya `role="status"`. `.textContent` mengambil teks di dalamnya.

```ts
    expect(screen.getAllByTestId("post-item")).toHaveLength(3);
  });
```

**Cek 4:** jumlah kartu post sekarang **3**: 2 dari awal ditambah 1 yang baru.

---

## Test 3: Validasi form kosong (baris 54–63)

```ts
  it("menampilkan error kalau form kosong", async () => {
    const user = userEvent.setup();
    render(<PostsManager />);
    await screen.findByText("Post pertama");
```

Persiapan yang sama: buat user, tampilkan komponen, tunggu loading selesai.

```ts
    await user.click(screen.getByRole("button", { name: "Tambah" }));
```

Langsung klik **"Tambah"** tanpa mengisi apa-apa.

```ts
    expect(screen.getByRole("alert").textContent).toBe("Title dan body wajib diisi.");
```

Pesan error harus muncul. Di komponen, pesan error punya `role="alert"`.

```ts
    expect(api.createPost).not.toHaveBeenCalled();
  });
```

`createPost` **tidak boleh dipanggil**, karena form kosong seharusnya dicegah sebelum dikirim ke API. Kata `.not` membalik pengecekan: "saya harap ini **tidak** terjadi".

---

## Test 4: Update, mengubah post (baris 65–80)

```ts
  it("mengubah post (Update)", async () => {
    const user = userEvent.setup();
    vi.mocked(api.updatePost).mockImplementation(async (post) => post);
```

Mengatur `updatePost` palsu. Bedanya dengan `mockResolvedValue`: `mockImplementation` memberi **isi fungsi** sendiri.

Di sini isinya: "kembalikan lagi data yang dikirim" (`post => post`). Ini meniru server yang membalas dengan data yang sudah diubah.

```ts
    render(<PostsManager />);
    const item = (await screen.findByText("Post pertama")).closest("li")!;
```

Tampilkan komponen, lalu:

1. `findByText("Post pertama")` menemukan **judul** post pertama.
2. `.closest("li")` naik ke elemen `<li>` terdekat, yaitu **seluruh kartu** post pertama.
3. `!` memberi tahu TypeScript "saya yakin ini tidak kosong".

Kita butuh kartunya karena setiap kartu punya tombol Edit sendiri. Kita harus klik Edit **milik post pertama**.

```ts
    await user.click(within(item).getByRole("button", { name: "Edit" }));
```

`within(item)` berarti "cari **hanya di dalam** kartu post pertama". Lalu klik tombol **"Edit"** di situ.

Setelah diklik, form terisi dengan data post pertama dan judul form menjadi "Edit Post #1".

```ts
    const title = screen.getByLabelText("Title");
    await user.clear(title);
    await user.type(title, "Judul diubah");
```

Ambil kolom Title, **hapus isinya** (`clear`), lalu ketik judul baru "Judul diubah".

```ts
    await user.click(screen.getByRole("button", { name: "Simpan" }));
```

Saat mode edit, tombolnya bertuliskan **"Simpan"**, bukan "Tambah". Klik tombol itu.

```ts
    expect(api.updatePost).toHaveBeenCalledWith({ id: 1, userId: 1, title: "Judul diubah", body: "Isi pertama" });
```

**Cek 1:** `updatePost` dipanggil dengan data yang benar: id dan body tetap, hanya **title yang berubah**.

```ts
    expect(await screen.findByText("Judul diubah")).toBeDefined();
```

**Cek 2:** judul baru **tampil** di daftar.

```ts
    expect(screen.queryByText("Post pertama")).toBeNull();
  });
```

**Cek 3:** judul lama **sudah hilang**.

Di sini kita pakai `queryByText`, bukan `getByText`, karena:

- `getByText` akan **error** kalau teks tidak ada.
- `queryByText` mengembalikan `null` kalau teks tidak ada.

Jadi `queryBy` adalah alat yang tepat untuk memastikan sesuatu **tidak ada**.

---

## Test 5: Delete, menghapus post (baris 82–94)

```ts
  it("menghapus post (Delete)", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "confirm").mockReturnValue(true); // jsdom tidak punya dialog confirm
```

Saat tombol Hapus diklik, komponen menampilkan dialog **"Hapus post ini?"** lewat `confirm()`. Browser tiruan (jsdom) tidak bisa menampilkan dialog, jadi:

- `vi.spyOn(window, "confirm")` "menyadap" fungsi `confirm`.
- `.mockReturnValue(true)` membuatnya selalu menjawab **true**, seolah user menekan **OK**.

```ts
    vi.mocked(api.deletePost).mockResolvedValue();
```

Mengatur `deletePost` palsu supaya berhasil. Tanda kurungnya kosong karena `deletePost` memang tidak mengembalikan data apa-apa.

```ts
    render(<PostsManager />);
    const item = (await screen.findByText("Post kedua")).closest("li")!;
```

Tampilkan komponen, lalu ambil **kartu post kedua** dengan cara yang sama seperti di test Update.

```ts
    await user.click(within(item).getByRole("button", { name: "Hapus" }));
```

Klik tombol **"Hapus"** di kartu post kedua.

```ts
    expect(api.deletePost).toHaveBeenCalledWith(2);
```

**Cek 1:** `deletePost` dipanggil dengan id **2**, yaitu id post kedua.

```ts
    expect(screen.queryByText("Post kedua")).toBeNull();
```

**Cek 2:** post kedua **sudah hilang** dari layar.

```ts
    expect(screen.getAllByTestId("post-item")).toHaveLength(1);
  });
```

**Cek 3:** sisa kartu post tinggal **1**.

---

## Penutup (baris 95)

```ts
});
```

Menutup kelompok `describe("PostsManager", ...)`.

---

## Ringkasan

| Test | Aksi user | Yang dicek |
|---|---|---|
| 1. Read | Buka halaman | Muncul "Memuat data...", lalu tampil 2 post |
| 2. Create | Isi form, klik **Tambah** | API dipanggil, post baru tampil, pesan sukses, total 3 post |
| 3. Validasi | Klik **Tambah** tanpa isi | Pesan error tampil, API **tidak** dipanggil |
| 4. Update | Klik **Edit**, ubah judul, klik **Simpan** | API dipanggil, judul baru tampil, judul lama hilang |
| 5. Delete | Klik **Hapus**, jawab OK | API dipanggil, post hilang, sisa 1 post |

Semua test tetap mengikuti pola **AAA**:

1. **Arrange (siapkan):** atur mock, `render` komponen, tunggu loading.
2. **Act (jalankan):** ketik dan klik seperti user.
3. **Assert (periksa):** cek layar dan panggilan API dengan `expect`.

### Cara mencari elemen: `getBy`, `findBy`, dan `queryBy`

| Jenis | Kalau elemen tidak ada | Kapan dipakai |
|---|---|---|
| `getBy...` | **Error** | Elemen pasti **sudah** ada di layar |
| `findBy...` | **Menunggu** dulu, error kalau tetap tidak muncul | Elemen muncul **setelah menunggu** (data async) |
| `queryBy...` | Mengembalikan **`null`** | Memastikan elemen **tidak ada** |
| `getAllBy...` | **Error** | Mengambil **banyak** elemen sekaligus |

### Mencari elemen seperti user melihatnya

| Cara | Contoh | Mencari berdasarkan |
|---|---|---|
| `ByText` | `getByText("Post pertama")` | Tulisan yang terlihat |
| `ByLabelText` | `getByLabelText("Title")` | Label di atas kolom input |
| `ByRole` | `getByRole("button", { name: "Tambah" })` | Jenis elemen (tombol, alert, dll.) dan namanya |
| `ByTestId` | `getAllByTestId("post-item")` | Atribut `data-testid` (dipakai kalau cara lain sulit) |

### Kamus kecil

| Istilah | Arti |
|---|---|
| **`vi.mock`** | Mengganti **seluruh modul** dengan versi palsu |
| **`vi.fn()`** | Membuat satu **fungsi palsu** |
| **`vi.spyOn`** | "Menyadap" fungsi yang sudah ada supaya bisa diatur jawabannya |
| **`mockResolvedValue`** | Fungsi palsu async yang selalu membalas dengan nilai ini |
| **`mockImplementation`** | Memberi isi fungsi sendiri untuk fungsi palsu |
| **`mockReturnValue`** | Fungsi palsu (tidak async) yang selalu membalas dengan nilai ini |
| **`within(elemen)`** | Mencari hanya di dalam elemen tertentu |
| **`.closest("li")`** | Naik ke elemen `<li>` terdekat di atasnya |
| **`.not`** | Membalik pengecekan: "saya harap ini **tidak** terjadi" |
