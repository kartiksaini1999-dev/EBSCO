import { NextRequest, NextResponse } from "next/server";
import { CaseContentSchema } from "@/lib/schemas";
import { createCaseFromContent, listCaseSummaries } from "@/lib/case-repo";

export async function GET(request: NextRequest) {
  const includeNeedsReview = request.nextUrl.searchParams.get("all") === "1";
  const cases = await listCaseSummaries(includeNeedsReview);
  return NextResponse.json({ cases });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = CaseContentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const created = await createCaseFromContent(parsed.data);
  return NextResponse.json({ id: created.id }, { status: 201 });
}
