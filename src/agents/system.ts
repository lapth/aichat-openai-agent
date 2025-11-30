// src/agents/system.ts
import { Agent, handoff } from "@openai/agents";
import { createCustomer, getCustomer, listCustomers, updateCustomer, deleteCustomer } from "../tools/customer-tools.js";
import { createInvoice, getInvoice, listInvoices, updateInvoiceStatus, deleteInvoice } from "../tools/invoice-tools.js";
import { createUser, getUser, listUsers, updateUser, deleteUser } from "../tools/user-tools.js";
import { createCompany, getCompany, listCompanies, updateCompany, deleteCompany } from "../tools/company-tools.js";
import { createProduct, getProduct, listProducts, updateProduct, deleteProduct } from "../tools/product-tools.js";

// --- 1. Define Specialist Agents ---

const commonInstructions = `
You are a specialist in your domain.

CRITICAL INSTRUCTIONS:
1. **ACTION OVER TALK**: Do NOT describe what you are going to do. Just DO it.
2. **CHECK HISTORY**: Look at the conversation history. If the user asked to create/update something, and it hasn't happened yet, CALL THE TOOL IMMEDIATELY.
3. **PARTIAL FULFILLMENT**: If the user request contains multiple tasks (e.g., "Create Customer AND Invoice"), **IGNORE** the tasks that are not yours. Focus ONLY on your domain.
4. **NO APOLOGIES**: Do NOT explain what you cannot do. Do NOT apologize for not creating the invoice. Just create the customer.
5. **HANDOFF**: When your specific task is done (e.g., the customer is created), you MUST handoff back to the Orchestrator using \`transfer_to_Orchestrator\`.
6. **SILENT EXECUTION**: If you are calling a tool or handing off, DO NOT OUTPUT ANY TEXT. Text output stops the workflow.

Example:
User: "Create customer Bob and invoice for him"
You (CustomerAgent): [Call create_customer tool] -> [Result] -> [Call transfer_to_Orchestrator] (NO TEXT OUTPUT)
`.trim();

export const customerAgent = new Agent({
  name: "CustomerAgent",
  instructions: `You are the Customer Specialist. ${commonInstructions}`,
  tools: [createCustomer, getCustomer, listCustomers, updateCustomer, deleteCustomer],
});

export const invoiceAgent = new Agent({
  name: "InvoiceAgent",
  instructions: `You are the Invoice Specialist. ${commonInstructions}`,
  tools: [createInvoice, getInvoice, listInvoices, updateInvoiceStatus, deleteInvoice],
});

export const userAgent = new Agent({
  name: "UserAgent",
  instructions: `You are the User Specialist. ${commonInstructions}`,
  tools: [createUser, getUser, listUsers, updateUser, deleteUser],
});

export const companyAgent = new Agent({
  name: "CompanyAgent",
  instructions: `You are the Company Specialist. ${commonInstructions}`,
  tools: [createCompany, getCompany, listCompanies, updateCompany, deleteCompany],
});

export const productAgent = new Agent({
  name: "ProductAgent",
  instructions: `You are the Product Specialist. ${commonInstructions}`,
  tools: [createProduct, getProduct, listProducts, updateProduct, deleteProduct],
});

// --- 2. Define Orchestrator ---

export const mainAgent = new Agent({
  name: "Orchestrator",
  instructions: `
You are the Central Orchestrator for a multi-domain system (Customer, Invoice, User, Company, Product).
Your responsibilities:
- Receive the user's high-level request.
- Route the request to the appropriate specialist.
- Maintain the overall state of the workflow.
- Handle ambiguity.

AMBIGUITY HANDLING:
- Many agents have similar capabilities (e.g., "update name").
- If the user says "update name" without specifying the entity (User, Customer, Company, Product), you MUST ASK CLARIFYING QUESTIONS.
- Do NOT guess. Ask: "Do you mean update the name of a User, Customer, Company, or Product?"

ROUTING LOGIC:
1. Analyze the conversation history.
2. Identify the domain of the request:
   - Customer -> CustomerAgent
   - Invoice -> InvoiceAgent
   - User -> UserAgent
   - Company -> CompanyAgent
   - Product -> ProductAgent
3. If a specialist returns control to you:
   - CHECK: Did they finish their job?
   - CHECK: Is there a next step in the original user request?
   - IF yes, handoff to the next specialist.
   - IF no (all done), summarize the results to the user.

CRITICAL RULE: SILENT ROUTING
- **Do NOT narrate your routing decisions.**
- If you need to handoff to a specialist, CALL THE TOOL IMMEDIATELY. Do not say "I will transfer you...".
- **Text output stops the workflow.** Only output text if:
  1. You need clarification from the user.
  2. The ENTIRE workflow is complete and you are summarizing the results.

Example Flow (CORRECT):
User: "Create customer Bob and invoice for him."
You: [Call transfer_to_CustomerAgent] (NO TEXT)
CustomerAgent: [Call create_customer] -> [Call transfer_to_Orchestrator]
You: [Call transfer_to_InvoiceAgent] (NO TEXT)
InvoiceAgent: [Call create_invoice] -> [Call transfer_to_Orchestrator]
You: "Success! Created Bob and Invoice #123."
`.trim(),
  // Initial handoffs will be set below
});

// --- 3. Wire up Hub-and-Spoke Handoffs ---

// Specialists only handoff to the Hub (Orchestrator)
customerAgent.handoffs = [handoff(mainAgent)];
invoiceAgent.handoffs = [handoff(mainAgent)];
userAgent.handoffs = [handoff(mainAgent)];
companyAgent.handoffs = [handoff(mainAgent)];
productAgent.handoffs = [handoff(mainAgent)];

// Hub (Orchestrator) hands off to all Specialists
mainAgent.handoffs = [
  handoff(customerAgent),
  handoff(invoiceAgent),
  handoff(userAgent),
  handoff(companyAgent),
  handoff(productAgent),
];
