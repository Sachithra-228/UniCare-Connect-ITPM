import { NextRequest } from "next/server";
import { isDemoMode, jsonResponse } from "@/lib/api";
import { getMongoDatabase } from "@/lib/mongodb";
import { createNotification } from "@/lib/notifications";
import { requireSession } from "@/lib/session-auth";
import { addDemoPeerPost, getDemoPeerPosts, getDemoPeerReplies } from "@/lib/wellness-demo-store";

type PeerPostDocument = {
  _id?: { toString: () => string };
  title?: string;
  body?: string;
  tags?: string[];
  authorName?: string;
  userId?: string;
  firebaseUid?: string;
  anonymous?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
};

function canDeletePost(
  input: { userId?: string; firebaseUid?: string },
  context: { isAdmin: boolean; sessionUserId?: string; sessionFirebaseUid?: string }
) {
  if (context.isAdmin) return true;
  return (
    (input.userId && context.sessionUserId && input.userId === context.sessionUserId) ||
    (input.firebaseUid && context.sessionFirebaseUid && input.firebaseUid === context.sessionFirebaseUid)
  );
}

export async function GET(request: NextRequest) {
  const authResult = await requireSession(request);
  if (authResult.error) return authResult.error;
  const role = authResult.session.user?.role ?? "";
  const isAdmin = role === "admin" || role === "faculty" || role === "super_admin";
  const sessionUserId = authResult.session.user?._id;
  const sessionFirebaseUid = authResult.session.firebase.uid;

  if (isDemoMode()) {
    const posts = getDemoPeerPosts().map((item) => ({
      _id: item._id,
      title: item.title,
      body: item.body,
      tags: item.tags ?? [],
      authorName: item.authorName,
      anonymous: item.anonymous,
      createdAt: item.createdAt,
      replyCount: getDemoPeerReplies(item._id).length,
      canDelete: canDeletePost(
        { userId: item.userId, firebaseUid: item.firebaseUid },
        { isAdmin, sessionUserId, sessionFirebaseUid }
      )
    }));
    return jsonResponse(posts);
  }

  const database = await getMongoDatabase();
  const postsCollection = database.collection("peer_support_posts");
  const repliesCollection = database.collection("peer_support_replies");

  const posts = await postsCollection.find({}).sort({ createdAt: -1 }).toArray();
  const postIds = posts.map((item) => item._id.toString());
  const replies = postIds.length
    ? await repliesCollection
        .find({ postId: { $in: postIds } })
        .project({ postId: 1 })
        .toArray()
    : [];
  const replyCountByPostId = new Map<string, number>();
  replies.forEach((item) => {
    const postId = String(item.postId ?? "");
    if (!postId) return;
    replyCountByPostId.set(postId, (replyCountByPostId.get(postId) ?? 0) + 1);
  });

  return jsonResponse(
    posts.map((item: PeerPostDocument) => ({
      _id: item._id?.toString?.() ?? "",
      title: item.title ?? "",
      body: item.body ?? "",
      tags: Array.isArray(item.tags) ? item.tags : [],
      authorName: item.authorName ?? "Student",
      anonymous: Boolean(item.anonymous),
      createdAt: item.createdAt,
      replyCount: replyCountByPostId.get(item._id?.toString?.() ?? "") ?? 0,
      canDelete: canDeletePost(
        { userId: item.userId, firebaseUid: item.firebaseUid },
        { isAdmin, sessionUserId, sessionFirebaseUid }
      )
    }))
  );
}

export async function POST(request: NextRequest) {
  const payload = await request.json().catch(() => ({} as Record<string, unknown>));
  const title = String(payload.title ?? "").trim();
  const body = String(payload.body ?? "").trim();
  const tags = Array.isArray(payload.tags)
    ? payload.tags
        .map((item: unknown) => String(item).trim())
        .filter(Boolean)
        .slice(0, 5)
    : [];
  const anonymous = Boolean(payload.anonymous);

  if (!title || !body) {
    return jsonResponse({ message: "Title and message are required." }, 400);
  }

  const authResult = await requireSession(request);
  if (authResult.error) return authResult.error;
  const userId = authResult.session.user?._id;
  const firebaseUid = authResult.session.firebase.uid;
  const userName = authResult.session.user?.name ?? authResult.session.firebase.displayName ?? "Student";
  const authorName = anonymous ? "Anonymous" : userName;
  const now = new Date();

  if (isDemoMode()) {
    const post = addDemoPeerPost({
      title,
      body,
      tags,
      authorName,
      userId,
      firebaseUid,
      anonymous,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    });
    return jsonResponse({ message: "Post published", post }, 201);
  }

  const database = await getMongoDatabase();
  const document = {
    title,
    body,
    tags,
    authorName,
    userId,
    firebaseUid,
    anonymous,
    createdAt: now,
    updatedAt: now
  };
  const result = await database.collection("peer_support_posts").insertOne(document);

  await createNotification(database, {
    audienceRoles: ["admin", "super_admin"],
    title: "New peer support post",
    message: `${userName} published a peer support post.`,
    type: "wellness",
    sectionId: "peer-support"
  });

  return jsonResponse(
    { message: "Post published", post: { ...document, _id: result.insertedId.toString() } },
    201
  );
}
