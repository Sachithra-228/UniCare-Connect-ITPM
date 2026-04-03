import { NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { isDemoMode, jsonResponse } from "@/lib/api";
import { getMongoDatabase } from "@/lib/mongodb";
import { createNotification } from "@/lib/notifications";
import { requireSession } from "@/lib/session-auth";
import { addDemoPeerReply, getDemoPeerPosts, getDemoPeerReplies } from "@/lib/wellness-demo-store";

type RouteParams = { params: Promise<{ id: string }> };
type PeerReplyDocument = {
  _id?: { toString: () => string };
  postId?: string;
  message?: string;
  authorName?: string;
  userId?: string;
  firebaseUid?: string;
  anonymous?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
};

export async function GET(request: NextRequest, { params }: RouteParams) {
  const authResult = await requireSession(request);
  if (authResult.error) return authResult.error;

  const { id } = await params;
  if (!id) return jsonResponse({ message: "Post id is required." }, 400);

  if (isDemoMode()) {
    return jsonResponse(getDemoPeerReplies(id));
  }

  const database = await getMongoDatabase();
  const replies = await database
    .collection("peer_support_replies")
    .find({ postId: id })
    .sort({ createdAt: 1 })
    .toArray();

  return jsonResponse(
    replies.map((item: PeerReplyDocument) => ({
      ...item,
      _id: item._id?.toString?.() ?? ""
    }))
  );
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  if (!id) return jsonResponse({ message: "Post id is required." }, 400);

  const payload = await request.json().catch(() => ({} as Record<string, unknown>));
  const message = String(payload.message ?? "").trim();
  const anonymous = Boolean(payload.anonymous);
  if (!message) return jsonResponse({ message: "Reply message is required." }, 400);

  const authResult = await requireSession(request);
  if (authResult.error) return authResult.error;
  const userId = authResult.session.user?._id;
  const firebaseUid = authResult.session.firebase.uid;
  const userName = authResult.session.user?.name ?? authResult.session.firebase.displayName ?? "Student";
  const authorName = anonymous ? "Anonymous" : userName;
  const now = new Date();

  if (isDemoMode()) {
    const post = getDemoPeerPosts().find((item) => item._id === id);
    if (!post) return jsonResponse({ message: "Post not found." }, 404);
    const reply = addDemoPeerReply({
      postId: id,
      message,
      authorName,
      userId,
      firebaseUid,
      anonymous,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    });
    return jsonResponse({ message: "Reply published", reply }, 201);
  }

  const database = await getMongoDatabase();
  const postsCollection = database.collection("peer_support_posts");
  if (!/^[a-f0-9]{24}$/i.test(id)) return jsonResponse({ message: "Invalid post id." }, 400);
  const post = await postsCollection.findOne({ _id: new ObjectId(id) });
  if (!post) return jsonResponse({ message: "Post not found." }, 404);

  const document = {
    postId: id,
    message,
    authorName,
    userId,
    firebaseUid,
    anonymous,
    createdAt: now,
    updatedAt: now
  };
  const result = await database.collection("peer_support_replies").insertOne(document);

  const postUserId = typeof post.userId === "string" ? post.userId : undefined;
  const postFirebaseUid = typeof post.firebaseUid === "string" ? post.firebaseUid : undefined;
  const isSameUser =
    (postUserId && userId && postUserId === userId) ||
    (postFirebaseUid && postFirebaseUid === firebaseUid);
  if (!isSameUser) {
    await createNotification(database, {
      userId: postUserId,
      firebaseUid: postFirebaseUid,
      title: "New peer support reply",
      message: "Someone replied to your peer support post.",
      type: "wellness",
      sectionId: "wellness"
    });
  }

  return jsonResponse(
    { message: "Reply published", reply: { ...document, _id: result.insertedId.toString() } },
    201
  );
}
