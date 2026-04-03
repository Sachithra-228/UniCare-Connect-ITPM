import { NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { isDemoMode, jsonResponse } from "@/lib/api";
import { getMongoDatabase } from "@/lib/mongodb";
import { createNotification } from "@/lib/notifications";
import { requireSession } from "@/lib/session-auth";
import { deleteDemoPeerPost, getDemoPeerPosts } from "@/lib/wellness-demo-store";

type RouteParams = { params: Promise<{ id: string }> };

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  if (!id) return jsonResponse({ message: "Post id is required." }, 400);

  const authResult = await requireSession(request);
  if (authResult.error) return authResult.error;

  const role = authResult.session.user?.role ?? "";
  const isAdmin = role === "admin" || role === "faculty" || role === "super_admin";
  const sessionUserId = authResult.session.user?._id;
  const sessionFirebaseUid = authResult.session.firebase.uid;

  if (isDemoMode()) {
    const existing = getDemoPeerPosts().find((item) => item._id === id);
    if (!existing) return jsonResponse({ message: "Post not found." }, 404);

    const isOwner =
      (existing.userId && sessionUserId && existing.userId === sessionUserId) ||
      (existing.firebaseUid && existing.firebaseUid === sessionFirebaseUid);

    if (!isAdmin && !isOwner) return jsonResponse({ message: "Forbidden" }, 403);

    const deleted = deleteDemoPeerPost(id);
    if (!deleted) return jsonResponse({ message: "Post not found." }, 404);
    return jsonResponse({ message: "Post deleted." });
  }

  if (!/^[a-f0-9]{24}$/i.test(id)) return jsonResponse({ message: "Invalid post id." }, 400);

  const database = await getMongoDatabase();
  const postsCollection = database.collection("peer_support_posts");
  const repliesCollection = database.collection("peer_support_replies");

  const existing = await postsCollection.findOne({ _id: new ObjectId(id) });
  if (!existing) return jsonResponse({ message: "Post not found." }, 404);

  const postUserId = typeof existing.userId === "string" ? existing.userId : undefined;
  const postFirebaseUid =
    typeof existing.firebaseUid === "string" ? existing.firebaseUid : undefined;
  const isOwner =
    (postUserId && sessionUserId && postUserId === sessionUserId) ||
    (postFirebaseUid && postFirebaseUid === sessionFirebaseUid);

  if (!isAdmin && !isOwner) return jsonResponse({ message: "Forbidden" }, 403);

  await postsCollection.deleteOne({ _id: new ObjectId(id) });
  await repliesCollection.deleteMany({ postId: id });

  if (isAdmin && !isOwner) {
    await createNotification(database, {
      userId: postUserId,
      firebaseUid: postFirebaseUid,
      title: "Peer support post removed",
      message: "A post was removed by moderation.",
      type: "wellness",
      sectionId: "wellness"
    });
  }

  return jsonResponse({ message: "Post deleted." });
}

