import { NextRequest, NextResponse } from "next/server";
import { extractTextFromPdf } from "@/lib/pdf";
import { parseCaseFromText } from "@/lib/ingestion";
import { createCaseFromContent } from "@/lib/case-repo";

// Ad-hoc ingestion: accepts either multipart/form-data with a `file` (PDF) or
// JSON { text, sourceLabel } with pasted text. Always creates the case with
// status "needs_review" - the caller decides whether to go straight into an
// attempt (status doesn't gate practicing) or send the user to review it first.
export async function POST(request: NextRequest) {
  const contentType = request.headers.get("content-type") || "";
  let rawText: string;
  let sourceLabel: string;

  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "missing file" }, { status: 400 });
    }
    sourceLabel = file.name || "uploaded PDF";
    const buffer = Buffer.from(await file.arrayBuffer());
    if (file.type === "application/pdf" || file.name?.toLowerCase().endsWith(".pdf")) {
      rawText = await extractTextFromPdf(buffer);
    } else {
      rawText = buffer.toString("utf-8");
    }
  } else {
    const body = await request.json();
    if (!body.text || typeof body.text !== "string") {
      return NextResponse.json({ error: "missing text" }, { status: 400 });
    }
    rawText = body.text;
    sourceLabel = body.sourceLabel || "pasted text";
  }

  if (!rawText.trim()) {
    return NextResponse.json({ error: "no text could be extracted from the source" }, { status: 422 });
  }

  const ingested = await parseCaseFromText(rawText, sourceLabel);
  const created = await createCaseFromContent(ingested.case, {
    parseConfidence: ingested.parse_confidence,
    parseNotes: ingested.parse_notes,
    rawSourceText: rawText,
  });

  return NextResponse.json({
    id: created.id,
    content: ingested.case,
    parseConfidence: ingested.parse_confidence,
    parseNotes: ingested.parse_notes,
  });
}
