import { describe, expect, it } from "vitest";
import { whatsappConfirmationUrl } from "@/lib/payment-links";

describe("WhatsApp payment confirmation links", () => {
  it("normalizes the contact number and encodes the message", () => {
    expect(whatsappConfirmationUrl("+92 316-452-9515", "Order VA 123"))
      .toBe("https://wa.me/923164529515?text=Order%20VA%20123");
  });

  it("does not build a link when no contact number is configured", () => {
    expect(whatsappConfirmationUrl("", "Order VA 123")).toBeNull();
  });
});