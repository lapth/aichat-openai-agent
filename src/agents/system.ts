// src/agents/system.ts
import { Agent } from "@openai/agents";
import { createCustomer, getCustomer, listCustomers } from "../tools/customer-tools.js";
import {
  createInvoice,
  getInvoice,
  listInvoices,
  updateInvoiceStatus,
} from "../tools/invoice-tools.js";

// 1. Define Specialist Agents
export const customerAgent = new Agent({
  name: "CustomerAgent",
  instructions: "You are a specialist in managing customer data. Execute the requested operation and return the result.",
  tools: [createCustomer, getCustomer, listCustomers],
});

export const invoiceAgent = new Agent({
  name: "InvoiceAgent",
  instructions: "You are a specialist in managing invoices. Execute the requested operation and return the result.",
  tools: [createInvoice, getInvoice, listInvoices, updateInvoiceStatus],
});

// 2. Define Main Agent using Specialists as Tools
export const mainAgent = new Agent({
  name: "MainAssistant",
  instructions: `You are the orchestrator for customer and invoice tasks.
  
  You have access to two specialist agents as tools:
  1. CustomerAgent: For customer operations.
  2. InvoiceAgent: For invoice operations.
  
  Your goal is to complete the user's request by calling these agents in the correct order.
  
  Example Workflow: "Create invoice for new customer"
  1. Call CustomerAgent to create the customer.
  2. Use the returned customer ID to call InvoiceAgent to create the invoice.
  3. Respond to the user with the final result.
  
  Always complete the full workflow.`,
  tools: [
    customerAgent.asTool({
      toolName: "call_customer_agent",
      toolDescription: "Delegate a task to the Customer Agent. Provide a natural language instruction.",
    }),
    invoiceAgent.asTool({
      toolName: "call_invoice_agent",
      toolDescription: "Delegate a task to the Invoice Agent. Provide a natural language instruction.",
    }),
  ],
  model: process.env.OPENAI_MODEL || "gpt-4-turbo-preview",
});
