type DemoMentorshipMessage = {
  _id: string;
  sessionId: string;
  senderRole: "student" | "mentor" | "admin";
  senderUserId?: string;
  senderFirebaseUid?: string;
  text: string;
  createdAt: string;
  updatedAt: string;
};

let demoMentorshipMessages: DemoMentorshipMessage[] = [];

export function listDemoMentorshipMessages(sessionId: string): DemoMentorshipMessage[] {
  return demoMentorshipMessages
    .filter((item) => item.sessionId === sessionId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export function addDemoMentorshipMessage(
  input: Omit<DemoMentorshipMessage, "_id" | "createdAt" | "updatedAt">
): DemoMentorshipMessage {
  const now = new Date().toISOString();
  const row: DemoMentorshipMessage = {
    _id: `demo-chat-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: now,
    updatedAt: now,
    ...input
  };
  demoMentorshipMessages = [...demoMentorshipMessages, row];
  return row;
}

