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

// Initial Data
const initialData = {
  "users": [
    { "id": "USR-1", "name": "Alice Admin", "email": "alice@company.com", "role": "admin" },
    { "id": "USR-2", "name": "Bob Manager", "email": "bob@company.com", "role": "manager" }
  ],
  "companies": [
    { "id": "COM-1", "name": "Tech Corp", "address": "123 Tech Lane", "taxId": "TC-999" },
    { "id": "COM-2", "name": "Design Studio", "address": "456 Art Blvd", "taxId": "DS-888" }
  ],
  "customers": [
    { "id": "CUST-1", "name": "John Doe", "email": "john@example.com", "phone": "555-0101", "createdAt": "2024-01-01T00:00:00Z" },
    { "id": "CUST-2", "name": "Jane Smith", "email": "jane@example.com", "phone": "555-0102", "createdAt": "2024-01-02T00:00:00Z" }
  ],
  "products": [
    { "id": "PROD-1", "name": "Web Hosting", "price": 10.0, "category": "Service" },
    { "id": "PROD-2", "name": "Domain Registration", "price": 15.0, "category": "Service" },
    { "id": "PROD-3", "name": "Consulting Hour", "price": 100.0, "category": "Service" }
  ],
  "invoices": []
};

// Load Initial Data
initialData.users.forEach((u: User) => users.set(u.id, u));
initialData.companies.forEach((c: Company) => companies.set(c.id, c));
initialData.customers.forEach((c: Customer) => customers.set(c.id, c));
initialData.products.forEach((p: Product) => products.set(p.id, p));
// Invoices empty initially

console.log("✅ Mock data loaded successfully.");
