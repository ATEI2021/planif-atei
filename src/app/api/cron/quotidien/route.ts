import { NextResponse } from "next/server";
import { executerAutomatisationsQuotidiennes } from "@/lib/automatisations";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resume = await executerAutomatisationsQuotidiennes();
  return NextResponse.json(resume);
}
