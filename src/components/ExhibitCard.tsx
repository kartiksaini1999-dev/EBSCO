function parseMarkdownTable(text: string): { headers: string[]; rows: string[][] } | null {
  const lines = text
    .trim()
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2 || !lines[0].startsWith("|")) return null;
  const splitRow = (line: string) =>
    line
      .replace(/^\|/, "")
      .replace(/\|$/, "")
      .split("|")
      .map((cell) => cell.trim().replace(/^\*\*|\*\*$/g, ""));
  const headers = splitRow(lines[0]);
  const isSeparator = /^[-:\s|]+$/.test(lines[1]);
  const dataLines = isSeparator ? lines.slice(2) : lines.slice(1);
  const rows = dataLines.map(splitRow);
  return { headers, rows };
}

export function ExhibitCard({
  exhibitType,
  content,
}: {
  exhibitType: string;
  content: string;
}) {
  const table = exhibitType === "table" ? parseMarkdownTable(content) : null;

  return (
    <div className="mt-2 rounded-lg border border-blue-200 bg-blue-50 p-3">
      <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-blue-600">
        Exhibit {exhibitType === "chart" ? "(chart)" : ""}
      </div>
      {table ? (
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr>
              {table.headers.map((h, i) => (
                <th key={i} className="border-b border-blue-200 px-2 py-1 text-left font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, i) => (
              <tr key={i}>
                {row.map((cell, j) => (
                  <td key={j} className="border-b border-blue-100 px-2 py-1">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="whitespace-pre-wrap text-sm text-neutral-800">{content}</p>
      )}
    </div>
  );
}
