import { describe, expect, it } from "vitest";
import { energyFrom, validateProduct } from "@/lib/product-validation";
import { seedState } from "@/lib/seed";

const all = seedState().products;
const p = all[0]!;

describe("product editor rules", () => {
  it("accepts a valid existing product", () => {
    expect(validateProduct(p, all)).toEqual({});
  });
  it("rejects a duplicate SKU", () => {
    expect(validateProduct({ ...p, id: "new", slug: "x" }, all).sku).toBeDefined();
  });
  it("rejects compare-at price not above price", () => {
    expect(validateProduct({ ...p, compareAt: p.price }, all).compareAt).toBeDefined();
  });
  it("rejects negative or fractional stock", () => {
    expect(validateProduct({ ...p, stock: -1 }, all).stock).toBeDefined();
    expect(validateProduct({ ...p, stock: 1.5 }, all).stock).toBeDefined();
  });
  it("blocks publishing without photos or category", () => {
    const e = validateProduct({ ...p, images: [], categoryId: "" }, all);
    expect(e.images).toBeDefined();
    expect(e.categoryId).toBeDefined();
  });
  it("allows saving a draft without photos", () => {
    expect(validateProduct({ ...p, images: [], published: false }, all).images).toBeUndefined();
  });
  it("computes energy as V × Ah", () => {
    expect(energyFrom(12.8, 100)).toBe(1280);
  });
});
