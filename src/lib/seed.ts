import hero from "@/assets/hero.jpg";
import station from "@/assets/p-station.jpg";
import lifepo4 from "@/assets/p-lifepo4.jpg";
import charger from "@/assets/p-charger.jpg";
import type { DbState, Product } from "./types";

export const IMAGES = { hero, station, lifepo4, charger };

const d = (days: number) => new Date(Date.now() - days * 864e5).toISOString();

const cats = [
  { id: "c1", slug: "lifepo4", name: "LiFePO4 Batteries", description: "Deep-cycle lithium iron phosphate for RV, marine, off-grid and solar.", image: lifepo4, sort: 1 },
  { id: "c2", slug: "battery-packs", name: "Battery Packs", description: "Custom and modular packs for e-mobility and industrial use.", image: hero, sort: 2 },
  { id: "c3", slug: "power-stations", name: "Power Stations", description: "Portable all-in-one energy for home backup and the outdoors.", image: station, sort: 3 },
  { id: "c4", slug: "chargers", name: "Chargers", description: "Smart multi-stage chargers tuned for lithium chemistries.", image: charger, sort: 4 },
  { id: "c5", slug: "bms", name: "BMS Systems", description: "Battery management boards with balancing and Bluetooth telemetry.", image: charger, sort: 5 },
  { id: "c6", slug: "accessories", name: "Accessories", description: "Busbars, cables, monitors, enclosures and mounting hardware.", image: lifepo4, sort: 6 },
];

type P = Omit<Product, "id" | "createdAt" | "published" | "lowStockThreshold" | "images"> & { img: string };
const raw: P[] = [
  { slug: "core-12v-100ah", name: "Core 12V 100Ah LiFePO4", sku: "VA-LFP-12100", categoryId: "c1", tagline: "The deep-cycle workhorse", description: "Grade-A prismatic cells, 100A continuous BMS with low-temperature cut-off, and 6,000+ cycles at 80% DoD. A drop-in replacement for lead-acid at a third of the weight.", price: 349, compareAt: 429, stock: 142, voltage: 12.8, capacityAh: 100, energyWh: 1280, chemistry: "LiFePO4", cycleLife: 6000, dimensions: "330 × 172 × 215 mm", weightKg: 10.8, warrantyYears: 10, specs: [{ label: "Max continuous discharge", value: "100 A" }, { label: "Charge voltage", value: "14.6 V" }, { label: "Operating temp.", value: "-20 °C to 60 °C" }, { label: "IP rating", value: "IP65" }], featured: true, img: lifepo4 },
  { slug: "core-12v-200ah", name: "Core 12V 200Ah LiFePO4", sku: "VA-LFP-12200", categoryId: "c1", tagline: "Double the endurance", description: "Twice the capacity in one sealed case with Bluetooth monitoring and self-heating for winter charging.", price: 629, compareAt: 749, stock: 64, voltage: 12.8, capacityAh: 200, energyWh: 2560, chemistry: "LiFePO4", cycleLife: 6000, dimensions: "522 × 240 × 218 mm", weightKg: 20.5, warrantyYears: 10, specs: [{ label: "Max continuous discharge", value: "200 A" }, { label: "Bluetooth", value: "Yes" }, { label: "Self-heating", value: "Yes" }], featured: true, img: hero },
  { slug: "rack-48v-100ah", name: "Rack 48V 100Ah Server Battery", sku: "VA-LFP-48100R", categoryId: "c1", tagline: "Stackable home storage", description: "19-inch rack-mount 5.12 kWh module with CAN/RS485 for inverter communication. Stack up to 16 units.", price: 1490, stock: 18, voltage: 51.2, capacityAh: 100, energyWh: 5120, chemistry: "LiFePO4", cycleLife: 8000, dimensions: "442 × 500 × 177 mm", weightKg: 46, warrantyYears: 10, specs: [{ label: "Communication", value: "CAN, RS485" }, { label: "Parallel", value: "Up to 16" }], featured: true, img: hero },
  { slug: "ebike-52v-20ah", name: "E-Mobility 52V 20Ah Pack", sku: "VA-NMC-5220", categoryId: "c2", tagline: "High energy density cells", description: "14S 21700 pack with 40A BMS, ideal for e-bikes and scooters.", price: 539, stock: 32, voltage: 52, capacityAh: 20, energyWh: 1040, chemistry: "NMC", cycleLife: 1000, dimensions: "370 × 90 × 110 mm", weightKg: 6.1, warrantyYears: 2, specs: [{ label: "Cells", value: "21700, 14S5P" }, { label: "BMS", value: "40 A" }], featured: false, img: hero },
  { slug: "custom-24v-50ah", name: "Modular 24V 50Ah Pack", sku: "VA-LFP-2450M", categoryId: "c2", tagline: "Built for robotics & AGVs", description: "Compact aluminum enclosure, smart BMS, and Anderson connectors.", price: 459, stock: 7, voltage: 25.6, capacityAh: 50, energyWh: 1280, chemistry: "LiFePO4", cycleLife: 5000, dimensions: "300 × 180 × 120 mm", weightKg: 11.2, warrantyYears: 5, specs: [{ label: "Connector", value: "Anderson SB50" }], featured: false, img: lifepo4 },
  { slug: "field-1500", name: "Field 1500 Power Station", sku: "VA-PS-1500", categoryId: "c3", tagline: "Silent power, anywhere", description: "1,536 Wh LiFePO4 power station with 1,800W pure sine output, 1-hour AC fast charging and 600W solar input.", price: 999, compareAt: 1199, stock: 45, voltage: 51.2, capacityAh: 30, energyWh: 1536, chemistry: "LiFePO4", cycleLife: 3500, dimensions: "380 × 260 × 300 mm", weightKg: 17, warrantyYears: 5, specs: [{ label: "AC output", value: "1800 W (3600 W surge)" }, { label: "Solar input", value: "600 W" }, { label: "Outlets", value: "13" }], featured: true, img: station },
  { slug: "field-500", name: "Field 500 Power Station", sku: "VA-PS-500", categoryId: "c3", tagline: "Weekend-ready", description: "Compact 512 Wh unit for camping, drones and laptops.", price: 449, stock: 88, voltage: 25.6, capacityAh: 20, energyWh: 512, chemistry: "LiFePO4", cycleLife: 3500, dimensions: "290 × 190 × 200 mm", weightKg: 6.4, warrantyYears: 5, specs: [{ label: "AC output", value: "600 W" }], featured: false, img: station },
  { slug: "smart-charger-20a", name: "Smart Charger 12V 20A", sku: "VA-CH-1220", categoryId: "c4", tagline: "Charge lithium properly", description: "CC/CV profile for LiFePO4 and Li-ion with temperature compensation and fault protection.", price: 129, stock: 210, voltage: 14.6, chemistry: "N/A", dimensions: "210 × 110 × 60 mm", weightKg: 1.3, warrantyYears: 2, specs: [{ label: "Output", value: "14.6 V / 20 A" }, { label: "Input", value: "100–240 VAC" }], featured: true, img: charger },
  { slug: "smart-charger-48v", name: "Smart Charger 48V 10A", sku: "VA-CH-4810", categoryId: "c4", tagline: "For 16S systems", description: "Fan-cooled aluminum charger for 48V LiFePO4.", price: 189, stock: 3, voltage: 58.4, chemistry: "N/A", dimensions: "240 × 120 × 70 mm", weightKg: 1.8, warrantyYears: 2, specs: [{ label: "Output", value: "58.4 V / 10 A" }], featured: false, img: charger },
  { slug: "bms-4s-120a", name: "Smart BMS 4S 120A", sku: "VA-BMS-4S120", categoryId: "c5", tagline: "Active balancing + Bluetooth", description: "Protects against over-charge, over-discharge, short-circuit and temperature extremes. App telemetry included.", price: 89, stock: 120, voltage: 12, chemistry: "LiFePO4", dimensions: "120 × 70 × 18 mm", weightKg: 0.2, warrantyYears: 1, specs: [{ label: "Balance current", value: "1 A active" }, { label: "Bluetooth", value: "Yes" }], featured: false, img: charger },
  { slug: "bms-16s-200a", name: "Smart BMS 16S 200A", sku: "VA-BMS-16S200", categoryId: "c5", tagline: "Home storage grade", description: "CAN + RS485 BMS for 48V systems with inverter protocols.", price: 219, stock: 26, voltage: 48, chemistry: "LiFePO4", dimensions: "190 × 110 × 30 mm", weightKg: 0.6, warrantyYears: 2, specs: [{ label: "Protocols", value: "Pylontech, Victron" }], featured: false, img: charger },
  { slug: "shunt-monitor", name: "Precision Shunt Monitor 500A", sku: "VA-ACC-SM500", categoryId: "c6", tagline: "Know your state of charge", description: "Coulomb-counting battery monitor with Bluetooth and 2.4\" display.", price: 79, stock: 0, chemistry: "N/A", dimensions: "100 × 60 × 30 mm", weightKg: 0.3, warrantyYears: 2, specs: [{ label: "Accuracy", value: "±0.1%" }], featured: false, img: charger },
];

export const seedState = (): DbState => ({
  categories: cats,
  products: raw.map(({ img, ...p }, i) => ({ ...p, id: `p${i + 1}`, images: [img, IMAGES.hero], published: true, lowStockThreshold: 10, createdAt: d(60 - i) })),
  reviews: [
    { id: "r1", productId: "p1", author: "Marcus T.", rating: 5, title: "Replaced 3 AGMs in my van", body: "Half the weight, holds voltage all night running the fridge. Bluetooth would be nice but the build quality is superb.", approved: true, createdAt: d(12) },
    { id: "r2", productId: "p1", author: "Ana R.", rating: 5, title: "Solid and well packaged", body: "Arrived in 2 days, perfectly balanced cells out of the box.", approved: true, createdAt: d(20) },
    { id: "r3", productId: "p6", author: "Jon P.", rating: 4, title: "Ran our house through an outage", body: "Kept the fridge and router up for 14 hours. Fan is a touch loud at full load.", approved: true, createdAt: d(5) },
    { id: "r4", productId: "p8", author: "Lee K.", rating: 5, title: "Finally a proper lithium profile", body: "Stops cleanly at 14.6 V. Great charger.", approved: false, createdAt: d(1) },
  ],
  users: [
    { id: "u-admin", email: "admin@voltarc.dev", name: "Store Admin", role: "admin", createdAt: d(200) },
    { id: "u-demo", email: "demo@voltarc.dev", name: "Alex Rivera", role: "customer", createdAt: d(40) },
  ],
  orders: [
    {
      id: "o1", number: "VA-10421", userId: "u-demo", email: "demo@voltarc.dev",
      items: [{ productId: "p1", name: "Core 12V 100Ah LiFePO4", sku: "VA-LFP-12100", price: 349, qty: 2, image: lifepo4 }],
      subtotal: 698, discount: 0, shipping: 0, tax: 55.84, total: 753.84, status: "shipped", paymentStatus: "paid", paymentMethod: "Card •••• 4242",
      shippingAddress: { name: "Alex Rivera", line1: "88 Harbor St", city: "Portland", region: "OR", postal: "97201", country: "US" },
      trackingNumber: "1Z999AA10123456784", carrier: "UPS",
      timeline: [{ status: "pending", at: d(4) }, { status: "paid", at: d(4) }, { status: "processing", at: d(3) }, { status: "shipped", at: d(2) }],
      createdAt: d(4),
    },
    {
      id: "o2", number: "VA-10398", userId: "u-demo", email: "demo@voltarc.dev",
      items: [{ productId: "p8", name: "Smart Charger 12V 20A", sku: "VA-CH-1220", price: 129, qty: 1, image: charger }],
      subtotal: 129, discount: 0, shipping: 15, tax: 10.32, total: 154.32, status: "delivered", paymentStatus: "paid", paymentMethod: "Card •••• 4242",
      shippingAddress: { name: "Alex Rivera", line1: "88 Harbor St", city: "Portland", region: "OR", postal: "97201", country: "US" },
      trackingNumber: "9400111899223857", carrier: "USPS",
      timeline: [{ status: "pending", at: d(25) }, { status: "paid", at: d(25) }, { status: "shipped", at: d(23) }, { status: "delivered", at: d(20) }],
      createdAt: d(25),
    },
    {
      id: "o3", number: "VA-10433", email: "sam@example.com",
      items: [{ productId: "p6", name: "Field 1500 Power Station", sku: "VA-PS-1500", price: 999, qty: 1, image: station }],
      subtotal: 999, discount: 99.9, shipping: 0, tax: 71.93, total: 971.03, couponCode: "CHARGE10", status: "processing", paymentStatus: "paid", paymentMethod: "PayPal",
      shippingAddress: { name: "Sam Okafor", line1: "12 Pine Ave", city: "Denver", region: "CO", postal: "80202", country: "US" },
      timeline: [{ status: "pending", at: d(1) }, { status: "paid", at: d(1) }, { status: "processing", at: d(0.5) }],
      createdAt: d(1),
    },
  ],
  coupons: [
    { id: "cp1", code: "CHARGE10", type: "percent", value: 10, minSubtotal: 200, active: true, used: 14, usageLimit: 500 },
    { id: "cp2", code: "WELCOME25", type: "fixed", value: 25, minSubtotal: 150, active: true, used: 3 },
  ],
  home: {
    heroEyebrow: "LiFePO4 · 6,000+ cycles · 10-year warranty",
    heroTitle: "Energy you can engineer around.",
    heroSubtitle: "Grade-A lithium batteries, power stations and BMS systems — tested cell by cell and backed by real engineers.",
    heroCta: "Shop batteries",
    announcement: "Free shipping on orders over $250 · Code CHARGE10 for 10% off",
  },
  settings: {
    storeName: "Voltarc Energy", supportEmail: "support@voltarc.dev", supportPhone: "+1 (800) 555-0199",
    currency: "USD", taxRate: 8, freeShippingThreshold: 250, flatShipping: 15,
  },
  cart: [],
  wishlist: [],
  sessionUserId: null,
  me: null,
  loaded: true,
  backendError: null,
});
