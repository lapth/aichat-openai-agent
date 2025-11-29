// src/agents/data.ts

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  createdAt: string;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  price: number;
  total: number;
}

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

// In-memory databases
export const customers: Map<string, Customer> = new Map();
export const invoices: Map<string, Invoice> = new Map();
