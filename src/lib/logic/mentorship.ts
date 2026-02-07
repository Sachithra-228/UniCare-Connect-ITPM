export function canScheduleSession(existingSessions: number, limit = 3) {
  return existingSessions < limit;
}

export function formatSessionTopic(topic: string) {
  return topic.trim().replace(/\s+/g, " ");
}

export function isValidSessionTime(date: string) {
  return !Number.isNaN(Date.parse(date));
}

export function calculateMentorScore(rating: number, sessions: number) {
  return rating * 10 + Math.min(sessions, 20);
}

export function isFeedbackRequired(status: "pending" | "confirmed" | "completed") {
  return status === "completed";
}
