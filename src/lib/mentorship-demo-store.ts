import { demoMentorshipSessions } from "@/lib/demo-data";
import type { MentorshipSession } from "@/types";

let demoSessionList: MentorshipSession[] = [...demoMentorshipSessions];

export function getDemoSessions(): MentorshipSession[] {
  return demoSessionList;
}

export function addDemoSession(session: MentorshipSession) {
  demoSessionList = [...demoSessionList, session];
}

export function getDemoSessionById(id: string): MentorshipSession | undefined {
  return demoSessionList.find((s) => s._id === id);
}

export function updateDemoSession(id: string, update: Partial<MentorshipSession>): boolean {
  const idx = demoSessionList.findIndex((s) => s._id === id);
  if (idx === -1) return false;
  demoSessionList = demoSessionList.slice();
  demoSessionList[idx] = { ...demoSessionList[idx], ...update, updatedAt: new Date().toISOString() };
  return true;
}
