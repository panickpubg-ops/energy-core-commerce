/**
 * Data layer. In development (no Supabase env vars) the store runs on a
 * seeded, persisted local state so the full app is usable. All mutations go
 * through the `actions` object below — swap each action's body for a Supabase
 * call (see supabase/schema.sql) once the project is connected.
 */
import { useSyncExternalStore } from "react";
import { seedState } from "./seed";
import type { DbState, Order, OrderStatus, Product, User } from "./types";

const KEY = "voltarc-db-v1";
const SEED = seedState();
let state: DbState = SEED;
const listeners = new Set<() => void>();

function emit() {
  if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(state));
  listeners.forEach((l) => l());
}
function set(fn: (s: DbState) => Partial<DbState>) {
  state = { ...state, ...fn(state) };
  emit();
}

let hydrated = false;
export function hydrateDb() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const saved = JSON.parse(raw) as DbState;
      // Re-map bundled image URLs (they change between builds) by keeping seed images for seed products.
      const seedImgs = new Map(SEED.products.map((p) => [p.id, p.images]));
      saved.products = saved.products.map((p) => (seedImgs.has(p.id) && p.images.every((i) => i.startsWith("/")) ? { ...p, images: seedImgs.get(p.id)! } : p));
      state = { ...SEED, ...saved };
      listeners.forEach((l) => l());
    }
  } catch {
    /* ignore */
  }
}

export function useDb<T>(sel: (s: DbState) => T): T {
  return useSyncExternalStore(
    (l) => (listeners.add(l), () => listeners.delete(l)),
    () => sel(state),
    () => sel(SEED),
  );
}
export const getDb = () => state;

const uid = (p: string) => `${p}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
export const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export function computeTotals(s: DbState, couponCode?: string) {
  const lines = s.cart
    .map((l) => ({ ...l, product: s.products.find((p) => p.id === l.productId)! }))
    .filter((l) => l.product);
  const subtotal = lines.reduce((a, l) => a + l.product.price * l.qty, 0);
  const coupon = couponCode ? s.coupons.find((c) => c.code.toUpperCase() === couponCode.toUpperCase() && c.active) : undefined;
  const couponValid = !!coupon && subtotal >= coupon.minSubtotal && (!coupon.usageLimit || coupon.used < coupon.usageLimit);
  const discount = couponValid ? (coupon!.type === "percent" ? (subtotal * coupon!.value) / 100 : Math.min(coupon!.value, subtotal)) : 0;
  const shipping = subtotal === 0 || subtotal - discount >= s.settings.freeShippingThreshold ? 0 : s.settings.flatShipping;
  const tax = Math.round((subtotal - discount) * s.settings.taxRate) / 100;
  return { lines, subtotal, discount, shipping, tax, total: subtotal - discount + shipping + tax, coupon: couponValid ? coupon : undefined };
}

export const actions = {
  // cart
  addToCart(productId: string, qty = 1) {
    set((s) => {
      const ex = s.cart.find((l) => l.productId === productId);
      return { cart: ex ? s.cart.map((l) => (l.productId === productId ? { ...l, qty: l.qty + qty } : l)) : [...s.cart, { productId, qty }] };
    });
  },
  setQty(productId: string, qty: number) {
    set((s) => ({ cart: qty <= 0 ? s.cart.filter((l) => l.productId !== productId) : s.cart.map((l) => (l.productId === productId ? { ...l, qty } : l)) }));
  },
  clearCart: () => set(() => ({ cart: [] })),
  toggleWishlist(id: string) {
    set((s) => ({ wishlist: s.wishlist.includes(id) ? s.wishlist.filter((w) => w !== id) : [...s.wishlist, id] }));
  },

  // auth
  signIn(email: string, password: string): User {
    const u = state.users.find((x) => x.email.toLowerCase() === email.toLowerCase() && x.password === password);
    if (!u) throw new Error("Invalid email or password");
    set(() => ({ sessionUserId: u.id }));
    return u;
  },
  signUp(name: string, email: string, password: string): User {
    if (state.users.some((x) => x.email.toLowerCase() === email.toLowerCase())) throw new Error("An account with this email already exists");
    const u: User = { id: uid("u"), name, email, password, role: "customer", createdAt: new Date().toISOString() };
    set((s) => ({ users: [...s.users, u], sessionUserId: u.id }));
    return u;
  },
  signOut: () => set(() => ({ sessionUserId: null })),
  updateUser(id: string, patch: Partial<User>) {
    set((s) => ({ users: s.users.map((u) => (u.id === id ? { ...u, ...patch } : u)) }));
  },

  // orders
  placeOrder(input: { email: string; address: Order["shippingAddress"]; couponCode?: string | undefined; paymentMethod: string }): Order {
    const t = computeTotals(state, input.couponCode);
    if (!t.lines.length) throw new Error("Your cart is empty");
    for (const l of t.lines) if (l.qty > l.product.stock) throw new Error(`Only ${l.product.stock} × ${l.product.name} in stock`);
    const now = new Date().toISOString();
    const order: Order = {
      id: uid("o"),
      number: `VA-${10434 + state.orders.length}`,
      userId: state.sessionUserId ?? undefined,
      email: input.email,
      items: t.lines.map((l) => ({ productId: l.productId, name: l.product.name, sku: l.product.sku, price: l.product.price, qty: l.qty, image: l.product.images[0] ?? "" })),
      subtotal: t.subtotal, discount: t.discount, shipping: t.shipping, tax: t.tax, total: t.total,
      couponCode: t.coupon?.code, status: "paid", paymentStatus: "paid", paymentMethod: input.paymentMethod,
      shippingAddress: input.address,
      timeline: [{ status: "pending", at: now }, { status: "paid", at: now }],
      createdAt: now,
    };
    set((s) => ({
      orders: [order, ...s.orders],
      cart: [],
      products: s.products.map((p) => {
        const l = t.lines.find((x) => x.productId === p.id);
        return l ? { ...p, stock: p.stock - l.qty } : p;
      }),
      coupons: s.coupons.map((c) => (c.id === t.coupon?.id ? { ...c, used: c.used + 1 } : c)),
    }));
    return order;
  },
  setOrderStatus(id: string, status: OrderStatus, extra?: Partial<Order>) {
    set((s) => ({
      orders: s.orders.map((o) =>
        o.id === id
          ? {
              ...o, ...extra, status,
              paymentStatus: status === "refunded" ? "refunded" : o.paymentStatus,
              timeline: o.status === status ? o.timeline : [...o.timeline, { status, at: new Date().toISOString() }],
            }
          : o,
      ),
    }));
  },

  // catalog
  saveProduct(p: Product) {
    set((s) => ({ products: s.products.some((x) => x.id === p.id) ? s.products.map((x) => (x.id === p.id ? p : x)) : [p, ...s.products] }));
  },
  deleteProduct: (id: string) => set((s) => ({ products: s.products.filter((p) => p.id !== id) })),
  newId: uid,
  saveCategory(c: DbState["categories"][number]) {
    set((s) => ({ categories: s.categories.some((x) => x.id === c.id) ? s.categories.map((x) => (x.id === c.id ? c : x)) : [...s.categories, c] }));
  },
  deleteCategory: (id: string) => set((s) => ({ categories: s.categories.filter((c) => c.id !== id) })),

  // reviews
  addReview(r: { productId: string; rating: number; title: string; body: string; author: string; userId?: string }) {
    set((s) => ({ reviews: [{ ...r, id: uid("r"), approved: false, createdAt: new Date().toISOString() }, ...s.reviews] }));
  },
  setReviewApproved: (id: string, approved: boolean) => set((s) => ({ reviews: s.reviews.map((r) => (r.id === id ? { ...r, approved } : r)) })),
  deleteReview: (id: string) => set((s) => ({ reviews: s.reviews.filter((r) => r.id !== id) })),

  // coupons, content, settings
  saveCoupon(c: DbState["coupons"][number]) {
    set((s) => ({ coupons: s.coupons.some((x) => x.id === c.id) ? s.coupons.map((x) => (x.id === c.id ? c : x)) : [...s.coupons, c] }));
  },
  deleteCoupon: (id: string) => set((s) => ({ coupons: s.coupons.filter((c) => c.id !== id) })),
  saveHome: (home: DbState["home"]) => set(() => ({ home })),
  saveSettings: (settings: DbState["settings"]) => set(() => ({ settings })),
  resetDemo() {
    state = seedState();
    emit();
  },
};

export function useSession() {
  return useDb((s) => s.users.find((u) => u.id === s.sessionUserId) ?? null);
}

export const money = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
export const fmtDate = (s: string) => new Date(s).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
