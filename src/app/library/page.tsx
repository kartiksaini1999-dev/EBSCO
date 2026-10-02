import Link from "next/link";
import { listCaseSummaries } from "@/lib/case-repo";
import { LibraryList } from "./LibraryList";

export default async function LibraryPage() {
  const cases = await listCaseSummaries(true);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Case Library</h1>
          <p className="mt-1 text-sm text-neutral-500">{cases.length} cases total</p>
        </div>
        <Link
          href="/upload"
          className="rounded bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-700"
        >
          Upload a new case
        </Link>
      </div>
      <LibraryList cases={cases} />
    </div>
  );
}
