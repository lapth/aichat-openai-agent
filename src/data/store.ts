// src/data/store.ts

// Types
export interface User { id: string; name: string; email: string; role: string; }
export interface Company { id: string; name: string; address: string; taxId: string; }
export interface Customer { id: string; name: string; email: string; phone: string; createdAt: string; }
export interface Product { id: string; name: string; price: number; category: string; }
export interface InvoiceItem { description: string; quantity: number; price: number; total: number; }
export interface Invoice {
  id: string;
  customerId: string;
  customerName?: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  createdAt: string;
  status: "draft" | "sent" | "paid";
}


// Stores
export const users = new Map<string, User>();
export const companies = new Map<string, Company>();
export const customers = new Map<string, Customer>();
export const products = new Map<string, Product>();
export const invoices = new Map<string, Invoice>();

// Load data from JSON file
import mockDataJson from './mock-data.json' with { type: 'json' };

const initialData = mockDataJson as {
  users: User[];
  companies: Company[];
  customers: Customer[];
  products: Product[];
  invoices: Invoice[];
};

// Load Initial Data
initialData.users.forEach((u: User) => users.set(u.id, u));
initialData.companies.forEach((c: Company) => companies.set(c.id, c));
initialData.customers.forEach((c: Customer) => customers.set(c.id, c));
initialData.products.forEach((p: Product) => products.set(p.id, p));
initialData.invoices.forEach((i: Invoice) => invoices.set(i.id, i));

console.log("✅ Mock data loaded successfully.");
console.log(`   - ${users.size} users`);
console.log(`   - ${companies.size} companies`);
console.log(`   - ${customers.size} customers`);
console.log(`   - ${products.size} products`);
console.log(`   - ${invoices.size} invoices`);
