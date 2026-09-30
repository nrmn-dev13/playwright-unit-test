// Client for JSONPlaceholder (https://jsonplaceholder.typicode.com), a free fake REST API.
// Writes are simulated: the server responds as if it succeeded but nothing is persisted.

export const API_URL = "https://jsonplaceholder.typicode.com";

// JSONPlaceholder only has posts 1-100; anything above that was created locally.
export const MAX_REMOTE_ID = 100;

export type Post = {
  id: number;
  userId: number;
  title: string;
  body: string;
};

export type PostInput = Pick<Post, "title" | "body">;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json; charset=UTF-8", ...init?.headers },
  });
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export function getPosts(limit = 10): Promise<Post[]> {
  return request<Post[]>(`/posts?_limit=${limit}`);
}

export function createPost(input: PostInput): Promise<Post> {
  return request<Post>("/posts", {
    method: "POST",
    body: JSON.stringify({ ...input, userId: 1 }),
  });
}

export function updatePost(post: Post): Promise<Post> {
  return request<Post>(`/posts/${post.id}`, {
    method: "PUT",
    body: JSON.stringify(post),
  });
}

export async function deletePost(id: number): Promise<void> {
  await request<unknown>(`/posts/${id}`, { method: "DELETE" });
}
