import { describe, expect, it } from "vitest";
import { csvCell, csvDocument } from "@/lib/csv";

describe("CSV spreadsheet safety", () => {
  it.each(["=1+1", "+cmd", "-1+2", "@SUM(A1:A2)", "\t=1+1", "\r=1+1", "\uFEFF=1+1"])(
    "neutralizes formula-like cell %j",
    (value) => {
      expect(csvCell(value)).toBe(`"'${value}"`);
    },
  );

  it("quotes and escapes separators, quotes, and line breaks", () => {
    expect(csvCell('a,b"c\nd')).toBe('"a,b""c\nd"');
  });

  it("serializes headers and rows as CSV", () => {
    expect(csvDocument(["email", "source"], [["person@example.com", "guide,signup"]])).toBe(
      '"email","source"\r\n"person@example.com","guide,signup"',
    );
  });
});