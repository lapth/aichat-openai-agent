// src/agents/system.ts
import { Agent, handoff } from "@openai/agents";
import { createCustomer, getCustomer, listCustomers } from "../tools/customer-tools.js";
import {
  createInvoice,
  getInvoice,
  listInvoices,
  updateInvoiceStatus,
} from "../tools/invoice-tools.js";

// --- 1. Define Agents (initially without handoffs to avoid circular reference issues during instantiation) ---

export const customerAgent = new Agent({
  name: "CustomerAgent",
  instructions: `
You are the Customer Specialist.
Your responsibilities:
- Create, retrieve, and list customers.
- Check the conversation history to see if a customer has already been created or found.

Collaboration:
- If the user wants to perform an invoice operation (create, list, etc.), HANDOFF to the InvoiceAgent.
- If you have finished your specific task and there are no more customer-specific requests, HANDOFF back to the MainAssistant to summarize or proceed.
`.trim(),
  tools: [createCustomer, getCustomer, listCustomers],
});

export const invoiceAgent = new Agent({
  name: "InvoiceAgent",
  instructions: `
You are the Invoice Specialist.
Your responsibilities:
- Create, retrieve, list, and update invoices.
- Check the conversation history for customer details (ID, name) before creating an invoice.

Collaboration:
- If you need a customer ID and it's not in the history, HANDOFF to the CustomerAgent to find or create the customer.
- If you have finished your specific task, HANDOFF back to the MainAssistant to summarize or proceed.
`.trim(),
  tools: [createInvoice, getInvoice, listInvoices, updateInvoiceStatus],
});

export const mainAgent = new Agent({
  name: "MainAssistant",
  instructions: `
You are the Lead Orchestrator.
Your responsibilities:
- Analyze the user's high-level request.
- Delegate tasks to the appropriate specialist (CustomerAgent or InvoiceAgent).
- Maintain the overall flow of the conversation.

Collaboration:
- If the user mentions customer details or operations, HANDOFF to CustomerAgent.
- If the user mentions invoice details or operations, HANDOFF to InvoiceAgent.
- When specialists return control to you, summarize the actions taken and ask if the user needs anything else.
`.trim(),
  // Initial handoffs will be set below
});

// --- 2. Wire up Mutual Handoffs ---

// CustomerAgent can handoff to InvoiceAgent (for next step) or MainAssistant (to finish)
customerAgent.handoffs = [
  handoff(invoiceAgent),
  handoff(mainAgent),
];

// InvoiceAgent can handoff to CustomerAgent (if missing info) or MainAssistant (to finish)
invoiceAgent.handoffs = [
  handoff(customerAgent),
  handoff(mainAgent),
];

// MainAssistant can handoff to both specialists
mainAgent.handoffs = [
  handoff(customerAgent),
  handoff(invoiceAgent),
];
