import { jsonResponse } from "@/lib/api";
import { demoUsers } from "@/lib/demo-data";

export async function GET() {
  return jsonResponse({ user: demoUsers[0], status: "authenticated" });
}
