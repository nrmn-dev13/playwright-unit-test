"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  MAX_REMOTE_ID,
  createPost,
  deletePost,
  getPosts,
  updatePost,
  type Post,
  type PostInput,
} from "@/lib/posts-api";

const EMPTY_FORM: PostInput = { title: "", body: "" };

export default function PostsManager() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [form, setForm] = useState<PostInput>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    getPosts()
      .then(setPosts)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const input = { title: form.title.trim(), body: form.body.trim() };
    if (!input.title || !input.body) {
      setError("Title dan body wajib diisi.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      if (editingId === null) {
        const created = await createPost(input);
        // JSONPlaceholder always returns id 101, so assign a unique local id instead.
        const id = Math.max(MAX_REMOTE_ID, ...posts.map((p) => p.id)) + 1;
        setPosts((prev) => [{ ...created, id }, ...prev]);
        setMessage("Post berhasil dibuat.");
      } else {
        const current = posts.find((p) => p.id === editingId)!;
        const next = { ...current, ...input };
        // Locally created posts don't exist on the server, so PUT would fail with 500.
        const updated = editingId > MAX_REMOTE_ID ? next : await updatePost(next);
        setPosts((prev) => prev.map((p) => (p.id === editingId ? updated : p)));
        setMessage("Post berhasil diperbarui.");
      }
      resetForm();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  function handleEdit(post: Post) {
    setEditingId(post.id);
    setForm({ title: post.title, body: post.body });
    setError(null);
    setMessage(null);
  }

  async function handleDelete(id: number) {
    if (!confirm("Hapus post ini?")) return;
    setError(null);
    setMessage(null);
    try {
      if (id <= MAX_REMOTE_ID) await deletePost(id);
      setPosts((prev) => prev.filter((p) => p.id !== id));
      if (editingId === id) resetForm();
      setMessage("Post berhasil dihapus.");
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <form
        onSubmit={handleSubmit}
        data-testid="post-form"
        className="flex flex-col gap-3 rounded-lg border border-black/10 p-4 dark:border-white/15"
      >
        <h2 className="text-lg font-semibold">
          {editingId === null ? "Tambah Post" : `Edit Post #${editingId}`}
        </h2>
        <label className="flex flex-col gap-1 text-sm">
          Title
          <input
            name="title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="rounded border border-black/20 bg-transparent px-3 py-2 dark:border-white/20"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Body
          <textarea
            name="body"
            rows={3}
            value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
            className="rounded border border-black/20 bg-transparent px-3 py-2 dark:border-white/20"
          />
        </label>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={submitting}
            className="rounded bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
          >
            {submitting ? "Menyimpan..." : editingId === null ? "Tambah" : "Simpan"}
          </button>
          {editingId !== null && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded border border-black/20 px-4 py-2 text-sm dark:border-white/20"
            >
              Batal
            </button>
          )}
        </div>
      </form>

      {error && (
        <p role="alert" className="rounded bg-red-100 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="rounded bg-green-100 px-3 py-2 text-sm text-green-800">
          {message}
        </p>
      )}

      {loading ? (
        <p>Memuat data...</p>
      ) : posts.length === 0 ? (
        <p>Belum ada post.</p>
      ) : (
        <ul data-testid="post-list" className="flex flex-col gap-3">
          {posts.map((post) => (
            <li
              key={post.id}
              data-testid="post-item"
              className="flex flex-col gap-2 rounded-lg border border-black/10 p-4 dark:border-white/15"
            >
              <div className="flex items-start justify-between gap-4">
                <h3 className="font-semibold">
                  <span className="text-zinc-500">#{post.id}</span> {post.title}
                </h3>
                <div className="flex shrink-0 gap-2">
                  <button
                    onClick={() => handleEdit(post)}
                    className="rounded border border-black/20 px-3 py-1 text-sm dark:border-white/20"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(post.id)}
                    className="rounded bg-red-600 px-3 py-1 text-sm text-white"
                  >
                    Hapus
                  </button>
                </div>
              </div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">{post.body}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
