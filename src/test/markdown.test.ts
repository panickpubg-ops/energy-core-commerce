import { describe, expect, it } from "vitest";
import { renderMarkdown } from "@/lib/markdown";

describe("blog markdown", () => {
  it("escapes raw HTML so posts cannot inject scripts", () => {
    expect(renderMarkdown("<script>alert(1)</script>")).not.toContain("<script>");
  });
  it("drops javascript: links", () => {
    expect(renderMarkdown("[x](javascript:alert(1))")).not.toContain("<a");
  });
});
