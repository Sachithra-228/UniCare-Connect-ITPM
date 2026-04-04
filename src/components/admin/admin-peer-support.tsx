"use client";

import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/shared/Card";
import { Button } from "@/components/shared/Button";

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

export function AdminPeerSupportModerationSection() {
  const [posts, setPosts] = useState<PeerPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [openPostId, setOpenPostId] = useState<string | null>(null);
  const [repliesByPostId, setRepliesByPostId] = useState<Record<string, PeerReply[]>>({});
  const [loadingReplyPostId, setLoadingReplyPostId] = useState<string | null>(null);
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);

  const refreshPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/peer-support-posts");
      const payload = await response.json().catch(() => []);
      if (!response.ok) {
        setError("Unable to load peer support posts.");
        setPosts([]);
        return;
      }
      setPosts(Array.isArray(payload) ? payload : []);
    } catch {
      setError("Unable to load peer support posts.");
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadReplies = useCallback(async (postId: string) => {
    setLoadingReplyPostId(postId);
    try {
      const response = await fetch(`/api/peer-support-posts/${postId}/replies`);
      const payload = await response.json().catch(() => []);
      setRepliesByPostId((previous) => ({
        ...previous,
        [postId]: Array.isArray(payload) ? payload : []
      }));
    } catch {
      setRepliesByPostId((previous) => ({ ...previous, [postId]: [] }));
    } finally {
      setLoadingReplyPostId(null);
    }
  }, []);

  const deletePost = async (postId: string) => {
    const confirmed = window.confirm("Delete this peer support post?");
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
      await refreshPosts();
    } catch {
      setError("Unable to delete post.");
    } finally {
      setDeletingPostId(null);
    }
  };

  useEffect(() => {
    refreshPosts();
  }, [refreshPosts]);

  return (
    <div className="space-y-5">
      <Card className="space-y-3 p-5">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Peer support moderation</h3>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Student peer support posts are listed here for monitoring and moderation.
        </p>
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        {message ? <p className="text-sm text-emerald-600">{message}</p> : null}
      </Card>

      <Card className="space-y-3 p-5">
        <div className="flex items-center justify-between">
          <h4 className="text-base font-semibold text-slate-900 dark:text-white">Recent student posts</h4>
          <Button variant="secondary" onClick={refreshPosts} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh"}
          </Button>
        </div>

        {loading ? (
          <p className="text-sm text-slate-500">Loading peer support posts...</p>
        ) : !posts.length ? (
          <p className="text-sm text-slate-500">No peer support posts yet.</p>
        ) : (
          <ul className="space-y-3">
            {posts.map((post) => {
              const isOpen = openPostId === post._id;
              const replies = repliesByPostId[post._id] ?? [];
              const loadingReplies = loadingReplyPostId === post._id;
              return (
                <li
                  key={post._id}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/30"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900 dark:text-white">{post.title}</p>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{post.body}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        By {post.authorName ?? "Student"} · {post.createdAt ? new Date(post.createdAt).toLocaleString() : "now"} · {post.replyCount ?? 0} replies
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="secondary"
                        onClick={async () => {
                          if (isOpen) {
                            setOpenPostId(null);
                            return;
                          }
                          setOpenPostId(post._id);
                          await loadReplies(post._id);
                        }}
                      >
                        {isOpen ? "Hide replies" : "View replies"}
                      </Button>
                      <Button
                        variant="ghost"
                        disabled={deletingPostId === post._id}
                        onClick={() => deletePost(post._id)}
                      >
                        {deletingPostId === post._id ? "Deleting..." : "Delete post"}
                      </Button>
                    </div>
                  </div>

                  {isOpen ? (
                    <div className="mt-3 border-t border-slate-200 pt-3 dark:border-slate-700">
                      {loadingReplies ? (
                        <p className="text-sm text-slate-500">Loading replies...</p>
                      ) : !replies.length ? (
                        <p className="text-sm text-slate-500">No replies yet.</p>
                      ) : (
                        <ul className="space-y-2">
                          {replies.map((reply) => (
                            <li
                              key={reply._id}
                              className="rounded-lg border border-slate-200 bg-white p-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                            >
                              <p className="text-slate-700 dark:text-slate-200">{reply.message}</p>
                              <p className="text-xs text-slate-500">
                                {reply.authorName ?? "Peer"} · {reply.createdAt ? new Date(reply.createdAt).toLocaleString() : "now"}
                              </p>
                            </li>
                          ))}
                        </ul>
                      )}
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

