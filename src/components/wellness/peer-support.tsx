"use client";

import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/shared/Card";
import { Badge } from "@/components/shared/Badge";
import { Button } from "@/components/shared/Button";
import { Input } from "@/components/shared/Input";
import { TextArea } from "@/components/shared/text-area";

type PeerPost = {
  _id: string;
  title: string;
  body: string;
  tags?: string[];
  authorName?: string;
  anonymous?: boolean;
  replyCount?: number;
  createdAt?: string;
  canDelete?: boolean;
};

type PeerReply = {
  _id: string;
  postId: string;
  message: string;
  authorName?: string;
  anonymous?: boolean;
  createdAt?: string;
};

export function PeerSupport() {
  const [posts, setPosts] = useState<PeerPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [anonymousPost, setAnonymousPost] = useState(true);
  const [creating, setCreating] = useState(false);

  const [openPostId, setOpenPostId] = useState<string | null>(null);
  const [repliesByPostId, setRepliesByPostId] = useState<Record<string, PeerReply[]>>({});
  const [loadingReplyPostId, setLoadingReplyPostId] = useState<string | null>(null);
  const [replyMessageByPostId, setReplyMessageByPostId] = useState<Record<string, string>>({});
  const [anonymousReplyByPostId, setAnonymousReplyByPostId] = useState<Record<string, boolean>>({});
  const [postingReplyPostId, setPostingReplyPostId] = useState<string | null>(null);
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);

  const refreshPosts = useCallback(() => {
    setLoading(true);
    fetch("/api/peer-support-posts")
      .then((response) => (response.ok ? response.json() : []))
      .then((data) => setPosts(Array.isArray(data) ? data : []))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, []);

  const loadReplies = useCallback(async (postId: string) => {
    setLoadingReplyPostId(postId);
    try {
      const response = await fetch(`/api/peer-support-posts/${postId}/replies`);
      const data = await response.json().catch(() => []);
      setRepliesByPostId((prev) => ({
        ...prev,
        [postId]: Array.isArray(data) ? data : []
      }));
    } catch {
      setRepliesByPostId((prev) => ({ ...prev, [postId]: [] }));
    } finally {
      setLoadingReplyPostId(null);
    }
  }, []);

  useEffect(() => {
    refreshPosts();
  }, [refreshPosts]);

  const publishPost = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    if (!title.trim() || !body.trim()) {
      setError("Title and message are required.");
      return;
    }

    setCreating(true);
    try {
      const response = await fetch("/api/peer-support-posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
          anonymous: anonymousPost
        })
      });
      const payload = await response.json().catch(() => ({} as { message?: string }));
      if (!response.ok) {
        setError(payload.message ?? "Unable to publish post.");
        return;
      }
      setTitle("");
      setBody("");
      setAnonymousPost(true);
      setMessage("Post published.");
      refreshPosts();
    } catch {
      setError("Unable to publish post.");
    } finally {
      setCreating(false);
    }
  };

  const postReply = async (postId: string) => {
    const replyMessage = (replyMessageByPostId[postId] ?? "").trim();
    if (!replyMessage) {
      setError("Reply message is required.");
      return;
    }

    setPostingReplyPostId(postId);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(`/api/peer-support-posts/${postId}/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: replyMessage,
          anonymous: anonymousReplyByPostId[postId] ?? true
        })
      });
      const payload = await response.json().catch(() => ({} as { message?: string }));
      if (!response.ok) {
        setError(payload.message ?? "Unable to publish reply.");
        return;
      }
      setReplyMessageByPostId((prev) => ({ ...prev, [postId]: "" }));
      setAnonymousReplyByPostId((prev) => ({ ...prev, [postId]: true }));
      setMessage("Reply published.");
      await loadReplies(postId);
      refreshPosts();
    } catch {
      setError("Unable to publish reply.");
    } finally {
      setPostingReplyPostId(null);
    }
  };

  const deletePost = async (postId: string) => {
    const confirmed = window.confirm("Delete this post? This action cannot be undone.");
    if (!confirmed) return;

    setDeletingPostId(postId);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(`/api/peer-support-posts/${postId}`, { method: "DELETE" });
      const payload = await response.json().catch(() => ({} as { message?: string }));
      if (!response.ok) {
        setError(payload.message ?? "Unable to delete post.");
        return;
      }
      if (openPostId === postId) {
        setOpenPostId(null);
      }
      setMessage("Post deleted.");
      refreshPosts();
    } catch {
      setError("Unable to delete post.");
    } finally {
      setDeletingPostId(null);
    }
  };

  return (
    <div className="space-y-5">
      <Card className="space-y-5 border-slate-100 bg-gradient-to-br from-white via-sky-50 to-cyan-50 p-5 shadow-md dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <span className="inline-flex rounded-full border border-sky-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-sky-700 dark:border-sky-400/20 dark:bg-sky-500/10 dark:text-sky-200">
              Peer support forum
            </span>
            <div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Share safely with other students</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Ask questions, share tips, and support each other. Keep discussions respectful and safe.
              </p>
            </div>
          </div>
          <div className="rounded-2xl border border-sky-100 bg-white/80 px-4 py-3 text-sm text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-300">
            <p className="font-semibold text-slate-900 dark:text-white">{posts.length}</p>
            <p>Active discussions</p>
          </div>
        </div>

        <form className="space-y-4" onSubmit={publishPost}>
          <div className="grid gap-4">
            <label className="space-y-2 text-sm font-medium text-slate-700 dark:text-slate-200">
              <span>Discussion title</span>
              <Input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="min-h-11 border-slate-200 bg-white/90 dark:bg-slate-950"
                placeholder="Post title"
              />
            </label>
            <label className="space-y-2 text-sm font-medium text-slate-700 dark:text-slate-200">
              <span>Your message</span>
              <TextArea
                rows={4}
                value={body}
                onChange={(event) => setBody(event.target.value)}
                className="border-slate-200 bg-white/90 dark:bg-slate-950"
                placeholder="Share your question or experience"
              />
            </label>
          </div>
          <label className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
            <input
              type="checkbox"
              checked={anonymousPost}
              onChange={(event) => setAnonymousPost(event.target.checked)}
            />
            Post anonymously
          </label>
          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
          {message ? <p className="text-sm text-emerald-600">{message}</p> : null}
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={creating}
              className="min-w-[160px] bg-sky-600 text-white shadow-sm hover:bg-sky-700"
            >
              {creating ? "Publishing..." : "Publish post"}
            </Button>
          </div>
        </form>
      </Card>

      <Card className="space-y-4 border-slate-100 p-5 shadow-md dark:border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Recent discussions</h3>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {posts.length} posts
          </span>
        </div>
        {loading ? (
          <p className="text-sm text-slate-500">Loading discussions...</p>
        ) : !posts.length ? (
          <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800/40">
            No discussions yet. Start the first one.
          </p>
        ) : (
          <ul className="space-y-3">
            {posts.map((post) => {
              const isOpen = openPostId === post._id;
              const replies = repliesByPostId[post._id] ?? [];
              const loadingReplies = loadingReplyPostId === post._id;
              return (
                <li
                  key={post._id}
                  className="rounded-3xl border border-slate-200 bg-gradient-to-r from-slate-50 to-white p-4 shadow-sm dark:border-slate-700 dark:from-slate-800/50 dark:to-slate-900"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="max-w-2xl">
                      <p className="font-semibold text-slate-900 dark:text-white">{post.title}</p>
                      <p className="mt-1 text-sm text-slate-500">{post.body}</p>
                      <p className="mt-2 text-xs text-slate-500">
                        By {post.authorName ?? "Student"} · {post.createdAt ? new Date(post.createdAt).toLocaleString() : "now"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="info">{post.replyCount ?? 0} replies</Badge>
                      {post.canDelete ? (
                        <Button
                          variant="ghost"
                          disabled={deletingPostId === post._id}
                          onClick={() => deletePost(post._id)}
                        >
                          {deletingPostId === post._id ? "Deleting..." : "Delete"}
                        </Button>
                      ) : null}
                      <Button
                        variant="secondary"
                        className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                        onClick={async () => {
                          if (isOpen) {
                            setOpenPostId(null);
                            return;
                          }
                          setOpenPostId(post._id);
                          await loadReplies(post._id);
                        }}
                      >
                        {isOpen ? "Hide" : "View"}
                      </Button>
                    </div>
                  </div>

                  {isOpen ? (
                    <div className="mt-4 space-y-4 border-t border-slate-200 pt-4 dark:border-slate-700">
                      {loadingReplies ? (
                        <p className="text-sm text-slate-500">Loading replies...</p>
                      ) : !replies.length ? (
                        <p className="text-sm text-slate-500">No replies yet.</p>
                      ) : (
                        <ul className="space-y-2">
                          {replies.map((reply) => (
                            <li
                              key={reply._id}
                              className="rounded-2xl border border-slate-200 bg-white p-3 text-sm dark:border-slate-700 dark:bg-slate-900"
                            >
                              <p className="text-slate-700 dark:text-slate-200">{reply.message}</p>
                              <p className="mt-2 text-xs text-slate-500">
                                {reply.authorName ?? "Peer"} · {reply.createdAt ? new Date(reply.createdAt).toLocaleString() : "now"}
                              </p>
                            </li>
                          ))}
                        </ul>
                      )}

                      <div className="space-y-2">
                        <TextArea
                          rows={3}
                          value={replyMessageByPostId[post._id] ?? ""}
                          onChange={(event) =>
                            setReplyMessageByPostId((prev) => ({
                              ...prev,
                              [post._id]: event.target.value
                            }))
                          }
                          className="border-slate-200 bg-white dark:bg-slate-950"
                          placeholder="Write a supportive reply"
                        />
                        <label className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                          <input
                            type="checkbox"
                            checked={anonymousReplyByPostId[post._id] ?? true}
                            onChange={(event) =>
                              setAnonymousReplyByPostId((prev) => ({
                                ...prev,
                                [post._id]: event.target.checked
                              }))
                            }
                          />
                          Reply anonymously
                        </label>
                        <div className="flex justify-end">
                          <Button
                            disabled={postingReplyPostId === post._id}
                            className="min-w-[140px] bg-sky-600 text-white shadow-sm hover:bg-sky-700"
                            onClick={() => postReply(post._id)}
                          >
                            {postingReplyPostId === post._id ? "Posting..." : "Post reply"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
