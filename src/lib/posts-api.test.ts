import { afterEach, describe, expect, it, vi } from "vitest";
import { API_URL, createPost, deletePost, getPosts, updatePost } from "./posts-api";

// Ganti fetch asli dengan fungsi palsu, supaya tidak memanggil internet
const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

function mockResponse(data: unknown, ok = true, status = 200) {
  fetchMock.mockResolvedValueOnce({
    ok,
    status,
    statusText: ok ? "OK" : "Error",
    json: async () => data,
  });
}

afterEach(() => {
  fetchMock.mockReset();
});

describe("posts-api", () => {
  it("getPosts mengambil daftar post dengan limit", async () => {
    const posts = [{ id: 1, userId: 1, title: "A", body: "B" }];
    mockResponse(posts);

    const result = await getPosts(5);

    expect(fetchMock).toHaveBeenCalledWith(`${API_URL}/posts?_limit=5`, expect.any(Object));
    expect(result).toEqual(posts);
  });

  it("createPost mengirim POST dengan body JSON", async () => {
    mockResponse({ id: 101, userId: 1, title: "Baru", body: "Isi" });

    const result = await createPost({ title: "Baru", body: "Isi" });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${API_URL}/posts`);
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({ title: "Baru", body: "Isi", userId: 1 });
    expect(result.id).toBe(101);
  });

  it("updatePost mengirim PUT ke /posts/:id", async () => {
    const post = { id: 3, userId: 1, title: "Edit", body: "Isi" };
    mockResponse(post);

    await updatePost(post);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${API_URL}/posts/3`);
    expect(init.method).toBe("PUT");
  });

  it("deletePost mengirim DELETE ke /posts/:id", async () => {
    mockResponse({});

    await deletePost(7);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${API_URL}/posts/7`);
    expect(init.method).toBe("DELETE");
  });

  it("melempar error kalau response tidak ok", async () => {
    mockResponse({}, false, 500);

    await expect(getPosts()).rejects.toThrow("Request failed: 500");
  });
});
