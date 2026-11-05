/** Serialize user-controlled values as safe CSV cells for spreadsheet applications. */
export function csvCell(value: unknown): string {
  const text = String(value ?? "");
  const formulaPrefix = /^[\u0000-\u0020\u007f\u00a0\ufeff]*[=+@-]/;
  const safeText = formulaPrefix.test(text) ? `'${text}` : text;
  return `"${safeText.replace(/"/g, '""')}"`;
}

export function csvDocument(headers: string[], rows: unknown[][]): string {
  return [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
}