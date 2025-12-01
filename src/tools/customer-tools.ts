// src/tools/customer-tools.ts
import { tool } from "@openai/agents";
import { z } from "zod";
import { customers, Customer } from "../data/store.js";

export const createCustomer = tool({
  name: "create_customer",
  description: "Create a new customer with name, email, and phone",
  parameters: z.object({
    name: z.string().describe("Customer name"),
    email: z.string().describe("Customer email"),
    phone: z.string().nullable().describe("Phone number"),
  }),
  execute: async ({ name, email, phone }) => {
    console.log('[create_customer] Executing with params:', { name, email, phone });
    const id = `CUST-${Date.now()}`;
    const customer: Customer = {
      id,
      name,
      email,
      phone: phone || "",
      createdAt: new Date().toISOString(),
    };
    customers.set(id, customer);
    return JSON.stringify(customer, null, 2);
  },
});

export const getCustomer = tool({
  name: "get_customer",
  description: "Get customer information by ID",
  parameters: z.object({
    id: z.string().describe("Customer ID"),
  }),
  execute: async ({ id }) => {
    console.log('[get_customer] Executing with params:', { id });
    const customer = customers.get(id);
    if (!customer) {
      return JSON.stringify({ error: "Customer not found" });
    }
    return JSON.stringify(customer, null, 2);
  },
});

export const listCustomers = tool({
  name: "list_customers",
  description: "Search for customers by name, email, or phone. REQUIRED: Must provide a non-empty search query. Returns max 20 matching customers.",
  parameters: z.object({
    query: z.string().describe("Search query for name, email, or phone number (required, cannot be empty). Use this to find specific customers."),
  }),
  execute: async ({ query }) => {
    console.log('[list_customers] Executing with params:', { query });

    // Validate query is not empty
    if (!query || query.trim() === '') {
      return JSON.stringify({ error: "Query parameter is required and cannot be empty. Please provide a search term." }, null, 2);
    }

    const startTime = Date.now();
    const lowerQuery = query.toLowerCase();
    let results = Array.from(customers.values()).filter(c =>
      c.name.toLowerCase().includes(lowerQuery) ||
      c.email.toLowerCase().includes(lowerQuery) ||
      c.phone.toLowerCase().includes(lowerQuery)
    );

    // Limit to max 20 results
    const totalFound = results.length;
    results = results.slice(0, 20);

    const elapsed = Date.now() - startTime;
    console.log(`[list_customers] Found ${totalFound} results (returning ${results.length}) in ${elapsed}ms`);
    return JSON.stringify(results, null, 2);
  },
});

export const updateCustomer = tool({
  name: "update_customer",
  description: "Update customer details",
  parameters: z.object({
    id: z.string().describe("Customer ID"),
    name: z.string().nullable().describe("New name"),
    email: z.string().nullable().describe("New email"),
    phone: z.string().nullable().describe("New phone"),
  }),
  execute: async ({ id, name, email, phone }) => {
    console.log('[update_customer] Executing with params:', { id, name, email, phone });
    const customer = customers.get(id);
    if (!customer) return JSON.stringify({ error: "Customer not found" });

    if (name) customer.name = name;
    if (email) customer.email = email;
    if (phone) customer.phone = phone;

    customers.set(id, customer);
    return JSON.stringify(customer, null, 2);
  },
});

export const deleteCustomer = tool({
  name: "delete_customer",
  description: "Delete a customer",
  parameters: z.object({
    id: z.string().describe("Customer ID"),
  }),
  execute: async ({ id }) => {
    console.log('[delete_customer] Executing with params:', { id });
    const deleted = customers.delete(id);
    return JSON.stringify({ success: deleted }, null, 2);
  },
});
