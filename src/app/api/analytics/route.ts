import { jsonResponse } from "@/lib/api";

export async function GET() {
  return jsonResponse({
    engagement: [
      { month: "Sep", users: 320, aid: 40 },
      { month: "Oct", users: 420, aid: 58 },
      { month: "Nov", users: 520, aid: 72 },
      { month: "Dec", users: 610, aid: 91 },
      { month: "Jan", users: 780, aid: 120 }
    ],
    wellness: [
      { week: "W1", score: 72 },
      { week: "W2", score: 68 },
      { week: "W3", score: 75 },
      { week: "W4", score: 80 }
    ]
  });
}
