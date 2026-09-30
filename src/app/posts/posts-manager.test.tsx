import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PostsManager from "./posts-manager";
import * as api from "@/lib/posts-api";

// Ganti fungsi API dengan mock, tapi pertahankan konstanta seperti MAX_REMOTE_ID.
vi.mock("@/lib/posts-api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/posts-api")>();
  return {
    ...actual,
    getPosts: vi.fn(),
    createPost: vi.fn(),
    updatePost: vi.fn(),
    deletePost: vi.fn(),
  };
});

const samplePosts = [
  { id: 1, userId: 1, title: "Post pertama", body: "Isi pertama" },
  { id: 2, userId: 1, title: "Post kedua", body: "Isi kedua" },
];

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(api.getPosts).mockResolvedValue(samplePosts);
});

describe("PostsManager", () => {
  it("menampilkan daftar post dari API (Read)", async () => {
    render(<PostsManager />);

    expect(screen.getByText("Memuat data...")).toBeDefined();
    expect(await screen.findByText("Post pertama")).toBeDefined();
    expect(screen.getAllByTestId("post-item")).toHaveLength(2);
  });

  it("menambah post baru (Create)", async () => {
    const user = userEvent.setup();
    vi.mocked(api.createPost).mockResolvedValue({ id: 101, userId: 1, title: "Post baru", body: "Isi baru" });
    render(<PostsManager />);
    await screen.findByText("Post pertama");

    await user.type(screen.getByLabelText("Title"), "Post baru");
    await user.type(screen.getByLabelText("Body"), "Isi baru");
    await user.click(screen.getByRole("button", { name: "Tambah" }));

    expect(api.createPost).toHaveBeenCalledWith({ title: "Post baru", body: "Isi baru" });
    expect(await screen.findByText("Post baru")).toBeDefined();
    expect(screen.getByRole("status").textContent).toBe("Post berhasil dibuat.");
    expect(screen.getAllByTestId("post-item")).toHaveLength(3);
  });

  it("menampilkan error kalau form kosong", async () => {
    const user = userEvent.setup();
    render(<PostsManager />);
    await screen.findByText("Post pertama");

    await user.click(screen.getByRole("button", { name: "Tambah" }));

    expect(screen.getByRole("alert").textContent).toBe("Title dan body wajib diisi.");
    expect(api.createPost).not.toHaveBeenCalled();
  });

  it("mengubah post (Update)", async () => {
    const user = userEvent.setup();
    vi.mocked(api.updatePost).mockImplementation(async (post) => post);
    render(<PostsManager />);
    const item = (await screen.findByText("Post pertama")).closest("li")!;

    await user.click(within(item).getByRole("button", { name: "Edit" }));
    const title = screen.getByLabelText("Title");
    await user.clear(title);
    await user.type(title, "Judul diubah");
    await user.click(screen.getByRole("button", { name: "Simpan" }));

    expect(api.updatePost).toHaveBeenCalledWith({ id: 1, userId: 1, title: "Judul diubah", body: "Isi pertama" });
    expect(await screen.findByText("Judul diubah")).toBeDefined();
    expect(screen.queryByText("Post pertama")).toBeNull();
  });

  it("menghapus post (Delete)", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "confirm").mockReturnValue(true); // jsdom tidak punya dialog confirm
    vi.mocked(api.deletePost).mockResolvedValue();
    render(<PostsManager />);
    const item = (await screen.findByText("Post kedua")).closest("li")!;

    await user.click(within(item).getByRole("button", { name: "Hapus" }));

    expect(api.deletePost).toHaveBeenCalledWith(2);
    expect(screen.queryByText("Post kedua")).toBeNull();
    expect(screen.getAllByTestId("post-item")).toHaveLength(1);
  });
});
