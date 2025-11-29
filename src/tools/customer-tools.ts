// src/tools/customer-tools.ts
import { tool } from "@openai/agents";
import { z } from "zod";
import { customers, Customer } from "../agents/data.js";

export const createCustomer = tool({
  name: "create_customer",
  description: "Create a new customer with name, email, and phone",
  parameters: z.object({
    name: z.string().describe("Customer name"),
    email: z.string().describe("Customer email"),
    phone: z.string().nullable().describe("Phone number"),
  }),
  execute: async ({ name, email, phone }) => {
    console.info("Executing createCustomer tool: ", { name, email, phone });
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
    const customer = customers.get(id);
    if (!customer) {
      return JSON.stringify({ error: "Customer not found" });
    }
    return JSON.stringify(customer, null, 2);
  },
});

export const listCustomers = tool({
  name: "list_customers",
  description: "List all customers",
  parameters: z.object({}),
  execute: async () => {
    const allCustomers = Array.from(customers.values());
    return JSON.stringify(allCustomers, null, 2);
  },
});
