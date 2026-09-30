# Penjelasan `posts-api.test.ts`

File ini menguji fungsi-fungsi di [`src/lib/posts-api.ts`](../src/lib/posts-api.ts), yaitu `getPosts`, `createPost`, `updatePost`, dan `deletePost`.

**Ide utamanya:** kita tidak mau test benar-benar memanggil internet, karena bisa lambat, bisa gagal kalau offline, dan hasilnya bisa berubah-ubah. Jadi `fetch` (fungsi untuk memanggil API) kita ganti dengan **fetch palsu**. Kita yang menentukan balasannya, lalu kita cek apakah fungsi kita memanggil `fetch` dengan benar.

> **Analogi:** seperti latihan menelepon restoran, tapi yang mengangkat telepon adalah teman kita sendiri. Kita tidak peduli makanannya datang atau tidak. Yang kita cek: apakah kita menyebut alamat dan pesanan dengan benar?

---

## Bagian 1: Import (baris 1–2)

```ts
import { afterEach, describe, expect, it, vi } from "vitest";
```

Mengambil alat-alat dari **Vitest** (library untuk testing):

| Alat | Kegunaan |
|---|---|
| `describe` | Membuat **kelompok** test |
| `it` | Membuat **satu** test |
| `expect` | Mengecek hasil: "saya harap nilainya begini" |
| `vi` | Kotak alat untuk membuat **mock** (barang palsu/tiruan) |
| `afterEach` | Menjalankan kode **setiap kali satu test selesai** |

```ts
import { API_URL, createPost, deletePost, getPosts, updatePost } from "./posts-api";
```

Mengambil kode **asli** yang mau diuji dari file `posts-api.ts`. `API_URL` berisi alamat API (`https://jsonplaceholder.typicode.com`).

---

## Bagian 2: Membuat fetch palsu (baris 4–6)

```ts
// Ganti fetch asli dengan fungsi palsu, supaya tidak memanggil internet
```

Komentar, tidak dijalankan. Hanya catatan untuk manusia.

```ts
const fetchMock = vi.fn();
```

`vi.fn()` membuat **fungsi palsu** yang kosong. Keistimewaannya: fungsi ini **mencatat** setiap kali dipanggil, termasuk berapa kali dan dengan argumen apa. Catatan itu nanti kita periksa.

```ts
vi.stubGlobal("fetch", fetchMock);
```

Mengganti `fetch` bawaan dengan `fetchMock`. Mulai sekarang, setiap kode yang memanggil `fetch(...)`, termasuk di dalam `posts-api.ts`, sebenarnya memanggil fungsi palsu kita.

---

## Bagian 3: Fungsi bantu `mockResponse` (baris 8–15)

```ts
function mockResponse(data: unknown, ok = true, status = 200) {
```

Fungsi buatan kita sendiri untuk **mengatur balasan** fetch palsu, supaya tidak menulis kode yang sama berulang-ulang. Parameternya:

- `data`: isi data yang mau "dikembalikan server".
- `ok = true`: apakah request dianggap berhasil. Nilai awalnya `true`.
- `status = 200`: kode status HTTP. `200` = sukses, `500` = server error.

```ts
  fetchMock.mockResolvedValueOnce({
```

Artinya: "**untuk panggilan berikutnya saja** (`Once`), balas dengan objek ini." Kata `Resolved` dipakai karena `fetch` asli itu async (mengembalikan Promise), jadi versi palsunya juga harus begitu.

```ts
    ok,
    status,
```

Menyalin nilai `ok` dan `status` ke dalam objek balasan. `ok,` adalah singkatan dari `ok: ok,`.

```ts
    statusText: ok ? "OK" : "Error",
```

Teks status. Kalau `ok` bernilai `true` isinya `"OK"`, kalau tidak isinya `"Error"`. Tanda `? :` adalah if-else versi singkat.

```ts
    json: async () => data,
```

Response `fetch` asli punya method `.json()` untuk membaca isi data. Di sini kita tiru: ketika `.json()` dipanggil, kembalikan `data` yang kita tentukan.

```ts
  });
}
```

Menutup objek dan fungsi.

---

## Bagian 4: Bersih-bersih setelah tiap test (baris 17–19)

```ts
afterEach(() => {
  fetchMock.mockReset();
});
```

Setiap kali **satu test selesai**, `mockReset()` menghapus semua catatan panggilan dan pengaturan balasan di `fetchMock`.

**Kenapa penting?** Supaya setiap test mulai dari kondisi bersih dan tidak "ketularan" sisa test sebelumnya. Misalnya, `fetchMock.mock.calls[0]` akan selalu berarti panggilan pertama **di test itu sendiri**.

---

## Bagian 5: Kelompok test (baris 21)

```ts
describe("posts-api", () => {
```

Membungkus semua test di bawahnya ke dalam satu kelompok bernama `"posts-api"`. Nama ini muncul di hasil test supaya mudah dibaca.

---

## Test 1: `getPosts` (baris 22–30)

```ts
  it("getPosts mengambil daftar post dengan limit", async () => {
```

Membuat satu test. Teks di dalam tanda kutip adalah **deskripsi** test. Kata `async` diperlukan karena di dalamnya kita memakai `await`.

```ts
    const posts = [{ id: 1, userId: 1, title: "A", body: "B" }];
```

Membuat data contoh: daftar berisi 1 post.

```ts
    mockResponse(posts);
```

Mengatur fetch palsu supaya membalas dengan data `posts` di atas.

```ts
    const result = await getPosts(5);
```

**Menjalankan kode yang diuji.** `getPosts(5)` berarti "ambil 5 post". `await` menunggu sampai selesai, lalu hasilnya disimpan di `result`.

```ts
    expect(fetchMock).toHaveBeenCalledWith(`${API_URL}/posts?_limit=5`, expect.any(Object));
```

**Cek 1:** apakah `fetch` dipanggil dengan alamat yang benar?

- Argumen pertama harus `https://jsonplaceholder.typicode.com/posts?_limit=5`.
- Argumen kedua boleh objek apa saja (`expect.any(Object)`), karena di test ini kita tidak peduli isinya.

```ts
    expect(result).toEqual(posts);
```

**Cek 2:** apakah hasil yang dikembalikan `getPosts` sama dengan data dari "server"?

`toEqual` membandingkan **isinya**, bukan apakah keduanya objek yang persis sama.

```ts
  });
```

Test selesai.

---

## Test 2: `createPost` (baris 32–42)

```ts
  it("createPost mengirim POST dengan body JSON", async () => {
    mockResponse({ id: 101, userId: 1, title: "Baru", body: "Isi" });
```

Mengatur balasan palsu: server "berhasil membuat" post dengan `id: 101`.

```ts
    const result = await createPost({ title: "Baru", body: "Isi" });
```

Menjalankan `createPost` dengan judul dan isi baru.

```ts
    const [url, init] = fetchMock.mock.calls[0];
```

Membuka **catatan** fetch palsu:

- `fetchMock.mock.calls` adalah daftar semua panggilan ke fetch.
- `[0]` adalah panggilan pertama.
- Setiap panggilan berisi argumen-argumennya, lalu kita pecah jadi dua variabel: `url` (alamat) dan `init` (pengaturan: method, body, headers).

```ts
    expect(url).toBe(`${API_URL}/posts`);
```

Alamatnya harus `/posts`. `toBe` dipakai untuk membandingkan nilai sederhana seperti teks atau angka.

```ts
    expect(init.method).toBe("POST");
```

Method-nya harus `POST`, karena POST = **membuat** data baru.

```ts
    expect(JSON.parse(init.body)).toEqual({ title: "Baru", body: "Isi", userId: 1 });
```

Body dikirim dalam bentuk teks JSON. `JSON.parse` mengubahnya kembali jadi objek, lalu kita cek isinya. Perhatikan `userId: 1` ikut terkirim karena `createPost` menambahkannya secara otomatis.

```ts
    expect(result.id).toBe(101);
  });
```

Hasil dari `createPost` harus punya `id` 101, sesuai balasan server palsu.

---

## Test 3: `updatePost` (baris 44–53)

```ts
  it("updatePost mengirim PUT ke /posts/:id", async () => {
    const post = { id: 3, userId: 1, title: "Edit", body: "Isi" };
    mockResponse(post);
```

Membuat data post dengan `id: 3`, lalu mengatur server palsu supaya membalas dengan data yang sama.

```ts
    await updatePost(post);
```

Menjalankan `updatePost`. Hasilnya tidak disimpan karena di test ini yang kita cek hanya cara memanggil `fetch`.

```ts
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${API_URL}/posts/3`);
    expect(init.method).toBe("PUT");
  });
```

Mengecek bahwa:

- alamatnya mengandung id post: `/posts/3`
- method-nya `PUT`, karena PUT = **mengubah** data.

---

## Test 4: `deletePost` (baris 55–63)

```ts
  it("deletePost mengirim DELETE ke /posts/:id", async () => {
    mockResponse({});
```

Server palsu membalas dengan objek kosong `{}`. Memang begitu balasan JSONPlaceholder saat menghapus.

```ts
    await deletePost(7);
```

Menghapus post dengan id 7.

```ts
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${API_URL}/posts/7`);
    expect(init.method).toBe("DELETE");
  });
```

Mengecek bahwa alamatnya `/posts/7` dan method-nya `DELETE`, karena DELETE = **menghapus** data.

---

## Test 5: Kalau server error (baris 65–69)

```ts
  it("melempar error kalau response tidak ok", async () => {
    mockResponse({}, false, 500);
```

Kali ini server palsu kita buat **gagal**: `ok = false`, `status = 500` (server error).

```ts
    await expect(getPosts()).rejects.toThrow("Request failed: 500");
  });
```

Kita **berharap** `getPosts()` gagal (`rejects`) dan melempar error dengan pesan yang mengandung `"Request failed: 500"`.

Test seperti ini penting: kita tidak hanya menguji jalur sukses, tapi juga memastikan kode **bereaksi dengan benar saat ada masalah**.

---

## Penutup (baris 70)

```ts
});
```

Menutup kelompok `describe("posts-api", ...)`.

---

## Ringkasan

| Test | Yang diuji |
|---|---|
| 1 | `getPosts` memanggil alamat yang benar dan mengembalikan data |
| 2 | `createPost` memakai `POST` dan mengirim body yang benar |
| 3 | `updatePost` memakai `PUT` ke `/posts/:id` |
| 4 | `deletePost` memakai `DELETE` ke `/posts/:id` |
| 5 | Kalau server error, fungsi melempar error |

Setiap test mengikuti pola yang sama, disebut **AAA**:

1. **Arrange (siapkan):** atur balasan palsu dengan `mockResponse(...)`.
2. **Act (jalankan):** panggil fungsi yang diuji, misalnya `await getPosts(5)`.
3. **Assert (periksa):** cek hasilnya dengan `expect(...)`.

### Kamus kecil

| Istilah | Arti |
|---|---|
| **Mock** | Barang tiruan yang menggantikan barang asli selama test |
| **`toBe`** | Sama persis (untuk teks, angka, boolean) |
| **`toEqual`** | Isinya sama (untuk objek dan array) |
| **`toHaveBeenCalledWith`** | Fungsi pernah dipanggil dengan argumen ini |
| **`rejects.toThrow`** | Promise gagal dengan error tertentu |
| **`async` / `await`** | Menunggu proses yang butuh waktu, seperti memanggil API |
