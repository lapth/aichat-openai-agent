// src/agents/system.ts
import { Agent, handoff } from "@openai/agents";
import { createCustomer, getCustomer, listCustomers } from "../tools/customer-tools.js";
import {
  createInvoice,
  getInvoice,
  listInvoices,
  updateInvoiceStatus,
} from "../tools/invoice-tools.js";

// --- 1. Define Agents (initially without handoffs) ---

export const customerAgent = new Agent({
  name: "CustomerAgent",
  instructions: `
You are the Customer Specialist.
Your responsibilities:
- Create, retrieve, and list customers.
- Check the conversation history to see if a customer has already been created or found.

CRITICAL HANDOFF RULES:
- You are a "Leaf Node" in the system. You do NOT communicate with other specialists.
- When you have successfully completed your task (e.g., created a customer), you MUST immediately handoff back to the Orchestrator.
- Use the tool \`transfer_to_Orchestrator\` to return control.
- DO NOT just say "I will transfer you". YOU MUST CALL THE TOOL.
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

CRITICAL HANDOFF RULES:
- You are a "Leaf Node" in the system. You do NOT communicate with other specialists.
- If you need a customer ID and it's not in the history, HANDOFF back to the Orchestrator (tool: \`transfer_to_Orchestrator\`) and ask them to find the customer first.
- When you have successfully completed your task, HANDOFF back to the Orchestrator (tool: \`transfer_to_Orchestrator\`).
- DO NOT just say "I will transfer you". YOU MUST CALL THE TOOL.
`.trim(),
  tools: [createInvoice, getInvoice, listInvoices, updateInvoiceStatus],
});

export const mainAgent = new Agent({
  name: "Orchestrator",
  instructions: `
You are the Central Orchestrator.
Your responsibilities:
- Receive the user's high-level request.
- Route the request to the appropriate specialist (CustomerAgent or InvoiceAgent).
- Maintain the overall state of the workflow.

ROUTING LOGIC:
1. Analyze the conversation history.
2. If the user wants to do X, and X belongs to CustomerAgent, handoff to CustomerAgent.
3. If the user wants to do Y, and Y belongs to InvoiceAgent, handoff to InvoiceAgent.
4. If a specialist returns control to you:
   - CHECK: Did they finish their job?
   - CHECK: Is there a next step in the original user request?
   - IF yes, handoff to the next specialist.
   - IF no (all done), summarize the results to the user.

Example Flow:
User: "Create customer Bob and invoice for him."
1. You -> transfer_to_CustomerAgent
2. CustomerAgent (creates Bob) -> transfer_to_Orchestrator
3. You (see Bob created, see pending invoice request) -> transfer_to_InvoiceAgent
4. InvoiceAgent (creates invoice) -> transfer_to_Orchestrator
5. You (see all done) -> "Success! Created Bob and Invoice #123."
`.trim(),
  // Initial handoffs will be set below
});

// --- 2. Wire up Hub-and-Spoke Handoffs ---

// Specialists only handoff to the Hub (Orchestrator)
customerAgent.handoffs = [handoff(mainAgent)];
invoiceAgent.handoffs = [handoff(mainAgent)];

// Hub (Orchestrator) hands off to all Specialists
mainAgent.handoffs = [
  handoff(customerAgent),
  handoff(invoiceAgent),
];
