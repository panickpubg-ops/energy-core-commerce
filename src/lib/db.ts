/**
 * Client data store backed by the owner's Supabase project.
 * Components read through `useDb(selector)`; every write goes through `actions`,
 * which calls Supabase and then refreshes the affected slice of state.
 * Only the shopping cart lives in localStorage.
 */
import { useRef, useSyncExternalStore } from "react";
import { supabase } from "./supabase";
import { seedState } from "./seed";
import type { Coupon, DbState, Order, OrderStatus, Product, Review, User } from "./types";

const CART_KEY = "voltarc-cart-v2";
const DEFAULTS = seedState();
const EMPTY: DbState = {
  ...DEFAULTS,
  categories: [], products: [], reviews: [], users: [], orders: [], coupons: [],
  cart: [], wishlist: [], sessionUserId: null, me: null, loaded: false, backendError: null,
};
let state: DbState = EMPTY;
const listeners = new Set<() => void>();

function set(fn: (s: DbState) => Partial<DbState>) {
  state = { ...state, ...fn(state) };
  if (typeof window !== "undefined") localStorage.setItem(CART_KEY, JSON.stringify(state.cart));
  listeners.forEach((l) => l());
}
const subscribe = (l: () => void) => (listeners.add(l), () => void listeners.delete(l));

// Selectors often return new arrays; cache per state object so the snapshot is stable.
export function useDb<T>(sel: (s: DbState) => T): T {
  const cache = useRef<{ s: DbState; v: T } | null>(null);
  const serverCache = useRef<{ v: T } | null>(null);
  const get = () => {
    if (!cache.current || cache.current.s !== state) cache.current = { s: state, v: sel(state) };
    return cache.current.v;
  };
  const getServer = () => (serverCache.current ??= { v: sel(EMPTY) }).v;
  return useSyncExternalStore(subscribe, get, getServer);
}
export const getDb = () => state;

// ---------------------------------------------------------------- mapping
/* eslint-disable @typescript-eslint/no-explicit-any */
const num = (v: any) => (v === null || v === undefined ? undefined : Number(v));
const one = (v: any) => (Array.isArray(v) ? v[0] : v);

function mapProduct(r: any): Product {
  const inv = one(r.inventory) ?? {};
  return {
    id: r.id, slug: r.slug, name: r.name, sku: r.sku, categoryId: r.category_id ?? "",
    tagline: r.tagline ?? "", description: r.description ?? "",
    price: Number(r.price), compareAt: num(r.compare_at),
    stock: inv.stock ?? 0, lowStockThreshold: inv.low_stock_threshold ?? 10,
    voltage: num(r.voltage), capacityAh: num(r.capacity_ah), energyWh: num(r.energy_wh),
    chemistry: r.chemistry, cycleLife: num(r.cycle_life), dimensions: r.dimensions ?? undefined,
    weightKg: num(r.weight_kg), warrantyYears: r.warranty_years ?? 1,
    images: [...(r.product_images ?? [])].sort((a: any, b: any) => a.sort - b.sort).map((i: any) => i.url),
    specs: Array.isArray(r.specs) ? r.specs : [],
    featured: !!r.featured, published: !!r.published, createdAt: r.created_at,
  };
}
const productRow = (p: Product) => ({
  id: p.id, slug: p.slug, sku: p.sku, name: p.name, category_id: p.categoryId || null,
  tagline: p.tagline, description: p.description, price: p.price, compare_at: p.compareAt ?? null,
  voltage: p.voltage ?? null, capacity_ah: p.capacityAh ?? null, energy_wh: p.energyWh ?? null,
  chemistry: p.chemistry, cycle_life: p.cycleLife ?? null, dimensions: p.dimensions ?? null,
  weight_kg: p.weightKg ?? null, warranty_years: p.warrantyYears, specs: p.specs,
  featured: p.featured, published: p.published,
});
function mapOrder(r: any): Order {
  return {
    id: r.id, number: r.number, userId: r.user_id ?? undefined, email: r.email,
    items: (r.order_items ?? []).map((i: any) => ({ productId: i.product_id ?? "", name: i.name, sku: i.sku, price: Number(i.unit_price), qty: i.qty, image: i.image_url ?? "" })),
    subtotal: Number(r.subtotal), discount: Number(r.discount), shipping: Number(r.shipping), tax: Number(r.tax), total: Number(r.total),
    couponCode: r.coupon_code ?? undefined, status: r.status, paymentStatus: r.payment_status, paymentMethod: r.payment_method ?? "—",
    shippingAddress: r.shipping_address, trackingNumber: r.tracking_number ?? undefined, carrier: r.carrier ?? undefined,
    timeline: [...(r.order_events ?? [])].sort((a: any, b: any) => a.created_at.localeCompare(b.created_at)).map((e: any) => ({ status: e.status, at: e.created_at })),
    createdAt: r.created_at,
  };
}
const mapReview = (r: any): Review => ({ id: r.id, productId: r.product_id, userId: r.user_id ?? undefined, author: r.author, rating: r.rating, title: r.title, body: r.body, approved: r.approved, createdAt: r.created_at });
const mapCoupon = (r: any): Coupon => ({ id: r.id, code: r.code, type: r.type, value: Number(r.value), minSubtotal: Number(r.min_subtotal), active: r.active, usageLimit: r.usage_limit ?? undefined, used: r.used, expiresAt: r.expires_at ?? undefined });

// ---------------------------------------------------------------- loading
function fail(where: string, error: { message: string } | null) {
  if (!error) return false;
  const missing = /relation .* does not exist|schema cache|Could not find the table/i.test(error.message);
  set(() => ({ loaded: true, backendError: missing ? "The store database isn't set up yet. Run supabase/schema.sql in your Supabase SQL editor." : `${where}: ${error.message}` }));
  return true;
}

async function loadCatalog() {
  const [cats, prods, revs, settings] = await Promise.all([
    supabase.from("categories").select("*").order("sort"),
    supabase.from("products").select("*, product_images(url, sort), inventory(stock, low_stock_threshold)").order("created_at", { ascending: false }),
    supabase.from("reviews").select("*").order("created_at", { ascending: false }),
    supabase.from("store_settings").select("*"),
  ]);
  if (fail("Categories", cats.error) || fail("Products", prods.error) || fail("Reviews", revs.error)) return;
  const store = settings.data?.find((r: any) => r.key === "store")?.value;
  const home = settings.data?.find((r: any) => r.key === "home")?.value;
  set((s) => ({
    loaded: true, backendError: null,
    categories: (cats.data ?? []).map((c: any) => ({ id: c.id, slug: c.slug, name: c.name, description: c.description ?? "", image: c.image_url ?? "", sort: c.sort })),
    products: (prods.data ?? []).map(mapProduct),
    reviews: (revs.data ?? []).map(mapReview),
    settings: store ? { storeName: store.store_name, supportEmail: store.support_email, supportPhone: store.support_phone, currency: store.currency, taxRate: Number(store.tax_rate), freeShippingThreshold: Number(store.free_shipping_threshold), flatShipping: Number(store.flat_shipping) } : s.settings,
    home: home ? { heroEyebrow: home.hero_eyebrow, heroTitle: home.hero_title, heroSubtitle: home.hero_subtitle, heroCta: home.hero_cta, announcement: home.announcement } : s.home,
  }));
  // Fill category images from their first product when none is set.
  set((s) => ({ categories: s.categories.map((c) => (c.image ? c : { ...c, image: s.products.find((p) => p.categoryId === c.id)?.images[0] ?? "" })) }));
}

async function loadUser(userId: string | null) {
  if (!userId) {
    set(() => ({ sessionUserId: null, me: null, orders: [], wishlist: [], users: [], coupons: [] }));
    return;
  }
  const [{ data: profile }, { data: roles }, { data: auth }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", userId),
    supabase.auth.getUser(),
  ]);
  const isAdmin = (roles ?? []).some((r: any) => r.role === "admin" || r.role === "staff");
  const me: User = { id: userId, email: profile?.email ?? auth.user?.email ?? "", name: profile?.full_name || auth.user?.email?.split("@")[0] || "Customer", role: isAdmin ? "admin" : "customer", phone: profile?.phone ?? undefined, createdAt: profile?.created_at ?? new Date().toISOString() };
  set(() => ({ sessionUserId: userId, me }));
  await Promise.all([loadOrders(), loadWishlist(), isAdmin ? loadAdminData() : Promise.resolve()]);
}

async function loadOrders() {
  const { data, error } = await supabase.from("orders").select("*, order_items(*), order_events(*)").order("created_at", { ascending: false });
  if (!error) set(() => ({ orders: (data ?? []).map(mapOrder) }));
}
async function loadWishlist() {
  const { data } = await supabase.from("wishlist_items").select("product_id");
  set(() => ({ wishlist: (data ?? []).map((w: any) => w.product_id) }));
}
async function loadAdminData() {
  const [coupons, profiles] = await Promise.all([supabase.from("coupons").select("*"), supabase.from("profiles").select("*")]);
  set(() => ({
    coupons: (coupons.data ?? []).map(mapCoupon),
    users: (profiles.data ?? []).map((p: any) => ({ id: p.id, email: p.email ?? "", name: p.full_name ?? "", role: "customer" as const, createdAt: p.created_at })),
  }));
}

let hydrated = false;
export function hydrateDb() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const cart = JSON.parse(localStorage.getItem(CART_KEY) ?? "[]");
    if (Array.isArray(cart)) set(() => ({ cart }));
  } catch { /* ignore */ }
  void loadCatalog();
  supabase.auth.getSession().then(({ data }) => loadUser(data.session?.user.id ?? null));
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
      if ((session?.user.id ?? null) !== state.sessionUserId) void loadUser(session?.user.id ?? null);
    }
  });
}

// ---------------------------------------------------------------- helpers
export const newId = () => crypto.randomUUID();
export const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const must = <T,>(r: { error: { message: string } | null; data?: T }) => {
  if (r.error) throw new Error(r.error.message);
  return r.data as T;
};

export function computeTotals(s: DbState, couponCode?: string) {
  const lines = s.cart
    .map((l) => ({ ...l, product: s.products.find((p) => p.id === l.productId)! }))
    .filter((l) => l.product);
  const subtotal = lines.reduce((a, l) => a + l.product.price * l.qty, 0);
  const coupon = couponCode ? s.coupons.find((c) => c.code.toUpperCase() === couponCode.toUpperCase() && c.active) : undefined;
  const couponValid = !!coupon && subtotal >= coupon.minSubtotal && (!coupon.usageLimit || coupon.used < coupon.usageLimit);
  const discount = couponValid ? (coupon!.type === "percent" ? Math.round(subtotal * coupon!.value) / 100 : Math.min(coupon!.value, subtotal)) : 0;
  const shipping = subtotal === 0 || subtotal - discount >= s.settings.freeShippingThreshold ? 0 : s.settings.flatShipping;
  const tax = Math.round((subtotal - discount) * s.settings.taxRate) / 100;
  return { lines, subtotal, discount, shipping, tax, total: subtotal - discount + shipping + tax, coupon: couponValid ? coupon : undefined };
}

// ---------------------------------------------------------------- actions
export const actions = {
  reload: loadCatalog,

  // cart (local)
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

  async toggleWishlist(id: string) {
    if (!state.sessionUserId) throw new Error("Sign in to save products");
    const has = state.wishlist.includes(id);
    set((s) => ({ wishlist: has ? s.wishlist.filter((w) => w !== id) : [...s.wishlist, id] }));
    const r = has
      ? await supabase.from("wishlist_items").delete().eq("product_id", id).eq("user_id", state.sessionUserId)
      : await supabase.from("wishlist_items").insert({ product_id: id, user_id: state.sessionUserId });
    if (r.error) { await loadWishlist(); throw new Error(r.error.message); }
  },

  // auth
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    await loadUser(data.user.id);
    return state.me!;
  },
  async signUp(name: string, email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name }, emailRedirectTo: window.location.origin } });
    if (error) throw new Error(error.message);
    if (!data.session) return null; // email confirmation required
    await loadUser(data.user!.id);
    return state.me;
  },
  async signOut() {
    await supabase.auth.signOut();
    await loadUser(null);
  },

  // checkout — prices, stock and coupons are enforced by the place_order SQL function
  async validateCoupon(code: string, subtotal: number) {
    const rows = must<any[]>(await supabase.rpc("validate_coupon", { _code: code, _subtotal: subtotal }));
    const c = rows?.[0];
    if (!c) return null;
    const coupon: Coupon = { id: `v-${c.code}`, code: c.code, type: c.type, value: Number(c.value), minSubtotal: 0, active: true, used: 0 };
    set((s) => ({ coupons: [...s.coupons.filter((x) => x.code !== c.code), coupon] }));
    return coupon;
  },
  async placeOrder(input: { email: string; address: Order["shippingAddress"]; couponCode?: string | undefined }) {
    const items = state.cart.map((l) => ({ product_id: l.productId, qty: l.qty }));
    if (!items.length) throw new Error("Your cart is empty");
    const row = must<any>(await supabase.rpc("place_order", { _email: input.email, _items: items, _address: input.address, _coupon: input.couponCode ?? null }));
    set(() => ({ cart: [] }));
    void loadCatalog();
    if (state.sessionUserId) void loadOrders();
    return { number: row.number as string, email: row.email as string };
  },
  async trackOrder(number: string, email: string) {
    const rows = must<any[]>(await supabase.rpc("track_order", { _number: number, _email: email }));
    const r = rows?.[0];
    if (!r) return null;
    return { number: r.number as string, status: r.status as OrderStatus, total: Number(r.total), carrier: r.carrier as string | null, trackingNumber: r.tracking_number as string | null, timeline: (r.events ?? []) as { status: OrderStatus; at: string }[] };
  },

  // admin: orders
  async setOrderStatus(id: string, status: OrderStatus, extra?: { carrier?: string; trackingNumber?: string }) {
    must(await supabase.from("orders").update({
      status,
      ...(status === "refunded" ? { payment_status: "refunded" } : {}),
      ...(extra?.carrier !== undefined ? { carrier: extra.carrier } : {}),
      ...(extra?.trackingNumber !== undefined ? { tracking_number: extra.trackingNumber } : {}),
    }).eq("id", id));
    await loadOrders();
  },

  // admin: catalog & inventory
  async saveProduct(p: Product) {
    const prev = state.products.find((x) => x.id === p.id);
    set((s) => ({ products: prev ? s.products.map((x) => (x.id === p.id ? p : x)) : [p, ...s.products] }));
    try {
      must(await supabase.from("products").upsert(productRow(p)));
      if (!prev || prev.images.join() !== p.images.join()) {
        must(await supabase.from("product_images").delete().eq("product_id", p.id));
        if (p.images.length) must(await supabase.from("product_images").insert(p.images.map((url, sort) => ({ product_id: p.id, url, sort }))));
      }
      const delta = p.stock - (prev?.stock ?? 0);
      if (delta) must(await supabase.from("inventory_movements").insert({ product_id: p.id, delta, reason: delta > 0 ? "restock" : "adjustment", created_by: state.sessionUserId }));
      if (!prev || prev.lowStockThreshold !== p.lowStockThreshold) must(await supabase.from("inventory").update({ low_stock_threshold: p.lowStockThreshold }).eq("product_id", p.id));
    } finally {
      await loadCatalog();
    }
  },
  async deleteProduct(id: string) {
    must(await supabase.from("products").delete().eq("id", id));
    await loadCatalog();
  },
  async uploadImage(file: Blob, name: string) {
    const path = `${Date.now()}-${slugify(name.replace(/\.[^.]+$/, ""))}.${name.split(".").pop() || "jpg"}`;
    must(await supabase.storage.from("product-images").upload(path, file, { upsert: true, contentType: file.type || "image/jpeg" }));
    return supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl;
  },
  /** One-time helper: copies the bundled sample products (and photos) into Supabase. */
  async importSampleCatalog() {
    const seed = seedState();
    const slugById = new Map(seed.categories.map((c) => [c.id, c.slug]));
    const catBySlug = new Map(state.categories.map((c) => [c.slug, c.id]));
    const uploaded = new Map<string, string>();
    for (const src of new Set(seed.products.flatMap((p) => p.images))) {
      const blob = await (await fetch(src)).blob();
      uploaded.set(src, await actions.uploadImage(blob, src.split("/").pop()!.split("?")[0]!));
    }
    for (const p of seed.products) {
      if (state.products.some((x) => x.sku === p.sku)) continue;
      const id = newId();
      must(await supabase.from("products").insert(productRow({ ...p, id, categoryId: catBySlug.get(slugById.get(p.categoryId) ?? "") ?? "" })));
      must(await supabase.from("product_images").insert(p.images.map((src, sort) => ({ product_id: id, url: uploaded.get(src)!, sort }))));
      if (p.stock) must(await supabase.from("inventory_movements").insert({ product_id: id, delta: p.stock, reason: "restock", note: "Sample import", created_by: state.sessionUserId }));
    }
    await loadCatalog();
  },

  // reviews
  async addReview(r: { productId: string; rating: number; title: string; body: string; author: string; userId?: string }) {
    must(await supabase.from("reviews").insert({ product_id: r.productId, rating: r.rating, title: r.title, body: r.body, author: r.author, user_id: r.userId ?? state.sessionUserId }));
    await loadCatalog();
  },
  async setReviewApproved(id: string, approved: boolean) {
    must(await supabase.from("reviews").update({ approved }).eq("id", id));
    await loadCatalog();
  },
  async deleteReview(id: string) {
    must(await supabase.from("reviews").delete().eq("id", id));
    await loadCatalog();
  },
};

export function useSession() {
  return useDb((s) => s.me);
}

export const money = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
export const fmtDate = (s: string) => new Date(s).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
