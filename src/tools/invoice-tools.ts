// src/tools/invoice-tools.ts
import { tool } from "@openai/agents";
import { z } from "zod";
import { invoices, Invoice, customers } from "../data/store.js";

export const createInvoice = tool({
  name: "create_invoice",
  description: "Create a new invoice for a customer with items",
  parameters: z.object({
    customerId: z.string().describe("Customer ID"),
    items: z.array(
      z.object({
        description: z.string(),
        quantity: z.number(),
        price: z.number(),
      })
    ).describe("List of items in the invoice"),
    taxRate: z.number().nullable().describe("Tax rate (%, default 10%)"),
  }),
  execute: async ({ customerId, items, taxRate }) => {
    console.log('[create_invoice] Executing with params:', { customerId, items, taxRate });
    const customer = customers.get(customerId);
    const customerName = customer ? customer.name : "Unknown";

    const id = `INV-${Date.now()}`;
    const invoiceItems = items.map((item) => ({
      ...item,
      total: item.quantity * item.price,
    }));

    const subtotal = invoiceItems.reduce((sum, item) => sum + item.total, 0);
    const rate = taxRate || 10;
    const tax = (subtotal * rate) / 100;
    const total = subtotal + tax;

    const invoice: Invoice = {
      id,
      customerId,
      customerName,
      items: invoiceItems,
      subtotal,
      tax,
      total,
      createdAt: new Date().toISOString(),
      status: "draft",
    };

    invoices.set(id, invoice);
    return JSON.stringify(invoice, null, 2);
  },
});

export const getInvoice = tool({
  name: "get_invoice",
  description: "Get invoice information by ID",
  parameters: z.object({
    id: z.string().describe("Invoice ID"),
  }),
  execute: async ({ id }) => {
    console.log('[get_invoice] Executing with params:', { id });
    const invoice = invoices.get(id);
    if (!invoice) {
      return JSON.stringify({ error: "Invoice not found" });
    }
    return JSON.stringify(invoice, null, 2);
  },
});

export const listInvoices = tool({
  name: "list_invoices",
  description: "List all invoices, optionally filter by customerId",
  parameters: z.object({
    customerId: z.string().nullable().describe("Filter by customer ID"),
  }),
  execute: async ({ customerId }) => {
    console.log('[list_invoices] Executing with params:', { customerId });
    let allInvoices = Array.from(invoices.values());
    if (customerId) {
      allInvoices = allInvoices.filter((inv) => inv.customerId === customerId);
    }
    return JSON.stringify(allInvoices, null, 2);
  },
});

export const updateInvoiceStatus = tool({
  name: "update_invoice_status",
  description: "Update invoice status",
  parameters: z.object({
    id: z.string().describe("Invoice ID"),
    status: z.enum(["draft", "sent", "paid"]).describe("New status"),
  }),
  execute: async ({ id, status }) => {
    console.log('[update_invoice_status] Executing with params:', { id, status });
    const invoice = invoices.get(id);
    if (!invoice) {
      return JSON.stringify({ error: "Invoice not found" });
    }
    invoice.status = status;
    invoices.set(id, invoice);
    return JSON.stringify(invoice, null, 2);
  },
});

export const deleteInvoice = tool({
  name: "delete_invoice",
  description: "Delete an invoice",
  parameters: z.object({
    id: z.string().describe("Invoice ID"),
  }),
  execute: async ({ id }) => {
    console.log('[delete_invoice] Executing with params:', { id });
    const deleted = invoices.delete(id);
    return JSON.stringify({ success: deleted }, null, 2);
  },
});
