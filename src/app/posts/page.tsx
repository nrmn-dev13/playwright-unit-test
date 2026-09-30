import type { Metadata } from "next";
import Link from "next/link";
import PostsManager from "./posts-manager";

export const metadata: Metadata = {
  title: "Posts CRUD",
};

export default function PostsPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10">
      <div className="flex flex-col gap-1">
        <Link href="/" className="text-sm text-zinc-500 hover:underline">
          ← Home
        </Link>
        <h1 className="text-2xl font-semibold">Posts CRUD</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Data dari{" "}
          <a
            href="https://jsonplaceholder.typicode.com"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            JSONPlaceholder
          </a>
          . Perubahan hanya disimpan di state lokal (API tidak benar-benar menyimpan data).
        </p>
      </div>
      <PostsManager />
    </main>
  );
}
