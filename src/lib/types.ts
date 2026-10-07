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
  compareAt?: number;
  stock: number;
  lowStockThreshold: number;
  voltage?: number;
  capacityAh?: number;
  energyWh?: number;
  chemistry: Chemistry;
  cycleLife?: number;
  dimensions?: string;
  weightKg?: number;
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
  userId?: string;
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
  password: string; // demo-mode only; real auth handled by Supabase
  name: string;
  role: "customer" | "admin";
  phone?: string;
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
  userId?: string;
  email: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  couponCode?: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: string;
  shippingAddress: Address;
  trackingNumber?: string;
  carrier?: string;
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
  usageLimit?: number;
  used: number;
  expiresAt?: string;
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
  cart: CartLine[];
  wishlist: string[];
  sessionUserId: string | null;
}
