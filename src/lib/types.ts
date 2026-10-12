export type Chemistry = "LiFePO4" | "NMC" | "Li-ion" | "LTO" | "N/A";

export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string;
  image: string;
  sort: number;
}

export interface ProductSpec {
  label: string;
  value: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  sku: string;
  categoryId: string;
  tagline: string;
  description: string;
  price: number;
  compareAt?: number | undefined;
  stock: number;
  lowStockThreshold: number;
  voltage?: number | undefined;
  capacityAh?: number | undefined;
  energyWh?: number | undefined;
  chemistry: Chemistry;
  cycleLife?: number | undefined;
  dimensions?: string | undefined;
  weightKg?: number | undefined;
  warrantyYears: number;
  images: string[];
  specs: ProductSpec[];
  featured: boolean;
  published: boolean;
  createdAt: string;
}

export interface Review {
  id: string;
  productId: string;
  userId?: string | undefined;
  author: string;
  rating: number;
  title: string;
  body: string;
  approved: boolean;
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: "customer" | "admin";
  phone?: string | undefined;
  createdAt: string;
}

export interface Address {
  name: string;
  line1: string;
  city: string;
  region: string;
  postal: string;
  country: string;
}

export type OrderStatus = "pending" | "paid" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded";
export type PaymentStatus = "unpaid" | "paid" | "refunded" | "failed";

export interface OrderItem {
  productId: string;
  name: string;
  sku: string;
  price: number;
  qty: number;
  image: string;
}

export interface Order {
  id: string;
  number: string;
  userId?: string | undefined;
  email: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  couponCode?: string | undefined;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: string;
  shippingAddress: Address;
  trackingNumber?: string | undefined;
  carrier?: string | undefined;
  timeline: { status: OrderStatus; at: string; note?: string }[];
  createdAt: string;
}

export interface Coupon {
  id: string;
  code: string;
  type: "percent" | "fixed";
  value: number;
  minSubtotal: number;
  active: boolean;
  usageLimit?: number | undefined;
  used: number;
  expiresAt?: string | undefined;
}

export interface HomeContent {
  heroEyebrow: string;
  heroTitle: string;
  heroSubtitle: string;
  heroCta: string;
  announcement: string;
}

export interface StoreSettings {
  storeName: string;
  supportEmail: string;
  supportPhone: string;
  currency: string;
  taxRate: number;
  freeShippingThreshold: number;
  flatShipping: number;
}

export interface CartLine {
  productId: string;
  qty: number;
}

export interface DbState {
  categories: Category[];
  products: Product[];
  reviews: Review[];
  users: User[];
  orders: Order[];
  coupons: Coupon[];
  home: HomeContent;
  settings: StoreSettings;
  config: SiteConfig;
  blogPosts: BlogPost[];
  roles: Record<string, AppRole[]>;
  movements: InventoryMovement[];
  cart: CartLine[];
  wishlist: string[];
  sessionUserId: string | null;
  me: User | null;
  loaded: boolean;
  backendError: string | null;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverUrl: string;
  tags: string[];
  author: string;
  seoTitle: string;
  seoDescription: string;
  published: boolean;
  publishedAt?: string | undefined;
  createdAt: string;
}

export type PaymentMethodKey = "card" | "bank_transfer" | "cod" | "invoice";

export interface SiteConfig {
  brand: { logoUrl: string; tagline: string; address: string; hours: string };
  payments: { testMode: boolean; methods: Record<PaymentMethodKey, boolean>; bankInstructions: string; invoiceTerms: string };
  seo: { titleSuffix: string; defaultDescription: string; ogImage: string; ga4Id: string; gtmId: string; metaPixelId: string; allowIndexing: boolean };
}

export interface InventoryMovement {
  id: string;
  productId: string;
  delta: number;
  reason: "restock" | "sale" | "adjustment" | "return" | "cancellation";
  note?: string | undefined;
  createdAt: string;
}

export type AppRole = "admin" | "staff" | "customer";
