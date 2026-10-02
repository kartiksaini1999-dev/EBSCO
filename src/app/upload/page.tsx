import { UploadFlow } from "./UploadFlow";

export default function UploadPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Upload a case</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Drop in a PDF or paste text - it&apos;ll be parsed into the case structure so you can review it
          before practicing.
        </p>
      </div>
      <UploadFlow />
    </div>
  );
}
