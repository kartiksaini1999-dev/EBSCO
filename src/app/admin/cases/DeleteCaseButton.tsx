"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteCaseButton({ caseId }: { caseId: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!window.confirm("Delete this case and all its attempts? This can't be undone.")) return;
    setDeleting(true);
    await fetch(`/api/cases/${caseId}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      className="text-xs text-red-600 hover:underline disabled:opacity-50"
    >
      {deleting ? "Deleting…" : "Delete"}
    </button>
  );
}
