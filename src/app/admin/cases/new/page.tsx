import { NewCaseForm } from "./NewCaseForm";

export default function NewCasePage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">New case</h1>
      <NewCaseForm />
    </div>
  );
}
