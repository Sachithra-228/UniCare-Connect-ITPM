export function getWellnessRecommendation(stressLevel: number, sleepHours: number) {
  if (stressLevel >= 7 || sleepHours < 6) {
    return "Prioritize rest and book a counseling session.";
  }
  if (stressLevel >= 4) {
    return "Try a mindfulness exercise and short walk.";
  }
  return "Keep up the good balance with regular breaks.";
}

export function normalizeMood(mood: string) {
  return mood.trim().toLowerCase();
}

export function isHighRiskMood(mood: string) {
  return ["low", "anxious"].includes(normalizeMood(mood));
}

export function calculateWellnessScore(stressLevel: number, sleepHours: number) {
  const stressScore = Math.max(0, 10 - stressLevel);
  const sleepScore = Math.min(10, Math.max(0, sleepHours));
  return Math.round((stressScore + sleepScore) / 2);
}

export function shouldSuggestChallenge(score: number) {
  return score < 7;
}
