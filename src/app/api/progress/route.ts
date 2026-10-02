import { NextResponse } from "next/server";
import { getProgressData } from "@/lib/progress";

export async function GET() {
  const data = await getProgressData();
  return NextResponse.json(data);
}
